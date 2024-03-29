// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use futures::prelude::*;
use irc::client::prelude::*;
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

    app_handle.listen_global("nhex://user_input/cooked", move |event| {
        let payload: UserInput =
            serde_json::from_str(event.payload().expect("input")).expect("json");
        let cmd_lc = payload.command.to_lowercase();
        // TODO: multiple networks (#33) will need to honor payload.server here!!
        if cmd_lc == "" {
            cclient
                .send_privmsg(payload.channel, payload.argsStr)
                .expect("send_privmsg");
        } else if cmd_lc == "msg" {
            let target = payload.args[0].clone();
            let private_msg = payload.args[1..].join(" ");
            cclient.send_privmsg(target, private_msg).expect("/msg");
        } else if cmd_lc == "join" {
            // can join multiple channels at once if given in the command:
            // e.g. /join #one #two #three
            cclient.send_join(payload.args.join(",")).expect("join");
        } else {
            println!(
                "UNHANDLED USER INPUT! {:?} {:?}",
                payload.command, payload.argsStr
            );
        }
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
