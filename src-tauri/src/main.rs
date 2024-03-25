// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use irc::client::prelude::*;
use futures::prelude::*;
use tauri::{Manager, Window};
use serde::{Deserialize, Serialize};
//use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};

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
    channels: Vec<String>,
    window: Window,
    app_handle: tauri::AppHandle
) {
    let server_clone = server.clone();
    let config = Config {
        nickname: Some(nick),
        server: Some(server),
        port: Some(port),
        use_tls: Some(false),
        channels: channels,
        version: Some("nhex vFILLIN".to_owned()),
        ..Config::default()
    };

    let client = Client::from_config(config).await;
    let mut cclient =  client.expect("!");
    cclient.identify().expect("ident");

    let stream = cclient.stream();
    let mut sstream = stream.expect("!!!!");

    // DAMMIT just make all the handling happen in here to allow moving cclient into it?
    app_handle.listen_global("nhex://user_input", move |event| {
        let payload: UserInput = serde_json::from_str(event.payload().expect("input")).expect("json");
        if payload.command.to_lowercase() == "privmsg" {
            // TODO: multiple networks will need to honor payload.server here!!
            cclient.send_privmsg(payload.channel, payload.argsStr).expect("send_privmsg");
        }
        else {
            println!("UNHANDLED USER INPUT! {:?} {:?}", payload.command, payload.argsStr);
        }
    });

    while let Ok(Some(message)) = sstream.next().await.transpose() {
        print!("<{}> {}", server_clone.clone(), message);
        window.emit("nhex://irc_message", IRCMessage {
            server: server_clone.clone(),
            message: message.to_string(),
        }).expect("emit");
    }
}

fn main() {
    /* Honestly, i think i prefer the in-browser-view menubar if only because it matches the look-n-feel...
    let hc_quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let hc_submenu = Submenu::new("nhex", Menu::new().add_item(hc_quit));
    let main_menu = Menu::new().add_submenu(hc_submenu);
     */

    tauri::Builder::default()
        //.menu(main_menu)
        .invoke_handler(tauri::generate_handler![connect])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
