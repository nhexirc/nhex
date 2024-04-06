// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::time::{SystemTime, UNIX_EPOCH};
use futures::prelude::*;
use irc::client::prelude::*;
use irc::proto::Command;
use serde::{Deserialize, Serialize};
use tauri::{Manager, Window, async_runtime};
use chrono::prelude::*;

#[derive(Clone, serde::Serialize)]
struct IRCMessage {
    message: String,
    server: String,
    timestamp: u128,
}

#[derive(Serialize, Deserialize)]
#[allow(non_snake_case)]
struct UserInput {
    server: String,
    channel: String,
    raw: String,
    command: String,
    args: Vec<String>,
    argsStr: String,
}

fn deserde(payload: &str) -> UserInput {
    return serde_json::from_str(payload).expect("json");
}

async fn connect_impl(
    nick: String,
    server: String,
    port: u16,
    tls: bool,
    window: Window,
    app_handle: tauri::AppHandle,
) {
    let config = Config {
        nickname: Some(nick.clone()),
        server: Some(server.clone()),
        port: Some(port),
        use_tls: Some(tls),
        version: Some("https://nhex.dev".to_owned()),
        ..Config::default()
    };

    let client = Client::from_config(config).await;
    let mut cclient = client.expect("!");
    cclient.identify().expect("ident");

    let stream = cclient.stream();
    let mut sstream = stream.expect("!!!!");

    let privmsg_sender = cclient.sender();
    app_handle.listen_global("nhex://user_input/privmsg", move |event| {
        let payload: UserInput = deserde(event.payload().expect("input"));
        privmsg_sender
            .send_privmsg(payload.channel, payload.argsStr)
            .expect("send_privmsg");
    });

    let join_sender = cclient.sender();
    app_handle.listen_global("nhex://user_input/join", move |event| {
        let payload: UserInput = deserde(event.payload().expect("join"));
        // can join multiple channels at once if given in the command:
        // e.g. /join #one #two #three
        join_sender.send_join(payload.args.join(",")).expect("join");
    });

    let part_sender = cclient.sender();
    app_handle.listen_global("nhex://user_input/part", move |event| {
        let payload: UserInput = deserde(event.payload().expect("join"));
        part_sender.send_part(payload.channel).expect("part");
    });

    let msg_sender = cclient.sender();
    app_handle.listen_global("nhex://user_input/msg", move |event| {
        let payload: UserInput = deserde(event.payload().expect("join"));
        // can join multiple channels at once if given in the command:
        // e.g. /join #one #two #three
        let target = payload.args[0].clone();
        let private_msg = payload.args[1..].join(" ");
        msg_sender.send_privmsg(target, private_msg).expect("/msg");
    });

    let whois_sender = cclient.sender();
    app_handle.listen_global("nhex://user_input/whois", move |event| {
        let payload: UserInput = deserde(event.payload().expect("join"));
        whois_sender.send(Command::WHOIS(
            Some("".to_string()),
            payload.args[0].to_string(),
        )).expect("whois");
    });

    let quit_sender = cclient.sender();
    let quit_handle = app_handle.app_handle();
    app_handle.listen_global("nhex://user_input/quit", move |event| {
        let payload: UserInput = deserde(event.payload().expect("quit"));
        let mut quit_msg = "https://nhex.dev".to_string();
        if payload.argsStr.len() > 0 {
            quit_msg = payload.argsStr.to_string();
        }
        quit_sender.send_quit(quit_msg).expect("quit");
        quit_handle.emit_all("nhex://user_input/quit/sent_ack", "").expect("quit/sent");
    });

    let server_clone = server.clone();
    while let Ok(Some(message)) = sstream.next().await.transpose() {
        let now = SystemTime::now();
        let now_since_epoch = now.duration_since(UNIX_EPOCH).expect("time");
        let now_dt: DateTime<Local> = now.into();
        print!("[{}] <{}> {}", now_dt.format("%d/%m/%Y %T%.3f"), server_clone.clone(), message);
        window
            .emit(
                "nhex://irc_message",
                IRCMessage {
                    server: server_clone.clone(),
                    message: message.to_string(),
                    timestamp: now_since_epoch.as_millis(),
                },
            )
            .expect("emit");
    }
}


// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
async fn connect(
    nick: String,
    server: String,
    port: u16,
    tls: bool,
    window: Window,
    app_handle: tauri::AppHandle,
) {
    async_runtime::spawn(
        connect_impl(nick, server, port, tls, window, app_handle)
    );
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![connect])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
