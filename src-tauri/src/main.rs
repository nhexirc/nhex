// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use futures::prelude::*;
use irc::client::prelude::*;
use irc::proto::Command;
use serde::{Deserialize, Serialize};
use tauri::{Manager, Window};

#[derive(Clone, serde::Serialize)]
struct IRCMessage {
    message: String,
    server: String,
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

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
async fn connect(
    nick: String,
    server: String,
    port: u16,
    tls: bool,
    channels: Vec<String>,
    window: Window,
    app_handle: tauri::AppHandle,
) {
    let config = Config {
        nickname: Some(nick.clone()),
        server: Some(server.clone()),
        port: Some(port),
        use_tls: Some(tls),
        channels: channels,
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
            .send_privmsg(payload.channel, "test")
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

    let server_clone = server.clone();
    while let Ok(Some(message)) = sstream.next().await.transpose() {
        print!("<{}> {}", server_clone.clone(), message);
        window
            .emit(
                "nhex://irc_message",
                IRCMessage {
                    server: server_clone.clone(),
                    message: message.to_string(),
                },
            )
            .expect("emit");
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![connect])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
