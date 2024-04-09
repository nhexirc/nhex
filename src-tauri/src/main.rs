// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod userinput;

use userinput::*;

use chrono::prelude::*;
use futures::prelude::*;
use irc::client::prelude::*;
use serde::Serialize;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{async_runtime, Manager, Window};

// Structs that will be serialized back to the TS side.
// As we only need to serialize them, we borrow where it makes sense.

#[derive(Clone, Serialize)]
struct UserInputResult<'a> {
    id: u32,
    server: &'a str,
    error: Option<UserInputError>,
}

#[derive(Clone, Serialize)]
struct IRCMessage<'a> {
    message: String,
    server: &'a str,
    timestamp: u128,
}

static VERSION_STRING: &str = "https://nhex.dev";
static EVENT_PATH_INPUT: &str = "nhex://command/do";
static EVENT_PATH_OUTPUT: &str = "nhex://command/ack";
static EVENT_PATH_ERROR: &str = "nhex://command/error";

async fn connect_impl(
    nick: String,
    server: String,
    port: u16,
    tls: bool,
    window: Window,
    app_handle: tauri::AppHandle,
) -> Result<(), irc::error::Error> {
    let alt_nicks = vec![
        format!("{}_", nick),
        format!("{}__", nick),
        format!("{}___", nick),
    ];
    let config = Config {
        nickname: Some(nick),
        alt_nicks,
        server: Some(server.clone()),
        port: Some(port),
        use_tls: Some(tls),
        version: Some(VERSION_STRING.to_owned()),
        ..Config::default()
    };

    let mut client = Client::from_config(config).await?;
    client.identify()?;

    let mut stream = client.stream()?;

    let sender = client.sender();
    let ack_handle = app_handle.app_handle();
    let server_name = server.clone();
    app_handle.listen_global(EVENT_PATH_INPUT, move |event| {
        let cmd = deserde(event);
        if cmd.server != server_name {
            return;
        }
        let id = cmd.id;
        let command = cmd.command.clone();
        let result = UserInputResult {
            id,
            server: server_name.as_str(),
            error: cmd.run(&sender).err(),
        };
        if result.error.is_some() {
            ack_handle
                .emit_all(&EVENT_PATH_ERROR, result)
                .expect("cannot emit err");
            ack_handle.emit_all(
                &format!("{EVENT_PATH_OUTPUT}/{command}"),
                serde_json::Value::Null,
            )
        } else {
            ack_handle.emit_all(&format!("{EVENT_PATH_OUTPUT}/{command}"), result)
        }
        .expect("cannot emit ack");
    });

    // TODO: Emit on success here.

    while let Some(message) = stream.next().await {
        let message = message?;
        let now = SystemTime::now();
        let now_since_epoch = now.duration_since(UNIX_EPOCH).expect("time before 1970");
        let now_dt: DateTime<Local> = now.into();
        print!(
            "[{}] <{}> {}",
            // TODO: Let this be configurable! Otherwise, use yyyy-mm-dd!
            now_dt.format("%d/%m/%Y %T%.3f"),
            server,
            message
        );
        window
            .emit(
                "nhex://irc_message",
                IRCMessage {
                    server: server.as_str(),
                    message: message.to_string(),
                    timestamp: now_since_epoch.as_millis(),
                },
            )
            .expect("cannot emit irc_message");
    }
    Ok(())
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
    async_runtime::spawn(async move {
        if let Err(_e) = connect_impl(nick, server, port, tls, window, app_handle).await {
            // TODO: How does nhex want to handle errors?
            // Probably emit an event.
        }
    });
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![connect])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
