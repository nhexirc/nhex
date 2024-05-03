// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod dnduploaders;
mod userdb;
mod userinput;

use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

use userinput::*;

use chrono::prelude::*;
use futures::prelude::*;
use irc::client::prelude::*;
use serde::Serialize;
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

fn user_db_path(app_handle: tauri::AppHandle, file_name: &str) -> PathBuf {
    let mut path_buf = app_handle.path_resolver().app_config_dir().unwrap();
    path_buf.push(format!("{}.sqlite3", file_name));
    return path_buf.to_owned();
}

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
        if !cmd.server.is_empty() && cmd.server != server_name {
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

    let mut channel_list_count: i128 = -1;
    let user_path_bind = user_db_path(app_handle, "nhex");
    let user_db_path = user_path_bind.to_str().expect("path");
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

        // do a very quick "parse", just enough to find the command ID, in order to determine
        // if these are LIST related commands (321-323) which are not to be emitted to the frontend at all.
        // XXX: should we just do the full message parse here instead of in the frontend?
        let mclone = message.clone().to_string();
        let parts = mclone.split(" ");
        let parts_vec: Vec<&str> = parts.collect::<Vec<&str>>();
        assert!(parts_vec.len() > 1);

        match parts_vec[1] {
            "321" => {
                assert!(channel_list_count == -1);
                channel_list_count = 0;
                continue;
            }
            "322" => {
                assert!(channel_list_count > -1);
                assert!(parts_vec.len() > 5);
                channel_list_count += 1;
                userdb::add_channel_list_entry(
                    user_db_path,
                    server.as_str(),
                    parts_vec[3],
                    parts_vec[4].parse::<u64>().expect("parse"),
                    parts_vec[5..].join(" ").as_str(),
                )
                .expect("add_channel_list_entry");
                continue;
            }
            "323" => {
                assert!(channel_list_count > -1);
                userdb::update_channel_list_meta(
                    user_db_path,
                    server.as_str(),
                    channel_list_count as u64,
                )
                .expect("update_channel_list_meta");
                channel_list_count = -1;
                continue;
            }
            _ => {}
        }

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

// could/should the user_db methods that don't require returning to the caller be invoke-able via an event too/instead?

#[tauri::command]
async fn user_db_init(app_handle: tauri::AppHandle) {
    userdb::init_logging_db(
        user_db_path(app_handle.app_handle(), "logging")
            .to_str()
            .expect("path"),
    )
    .expect("init_logging_db");
    userdb::init_user_db(
        user_db_path(app_handle.app_handle(), "nhex")
            .to_str()
            .expect("path"),
    )
    .expect("init_user_db");
}

#[tauri::command]
async fn user_db_log_message(log: userdb::Logging, app_handle: tauri::AppHandle) {
    userdb::add_logging(
        user_db_path(app_handle, "logging").to_str().expect("path"),
        log,
    )
    .expect("add_logging");
}

#[tauri::command]
async fn user_db_latest_channel_lines(
    network: String,
    channel: String,
    num_lines: u64,
    app_handle: tauri::AppHandle,
) -> Vec<String> {
    let lines: Vec<userdb::IRCMessageParsed> = userdb::get_latest_channel_lines(
        user_db_path(app_handle, "logging").to_str().expect("path"),
        network,
        channel,
        num_lines
    ).expect("get_latest_channel_lines");

    let mut ret_vec: Vec<String> = Vec::new();
    for line in lines.iter() {
        ret_vec.push(serde_json::to_string(line).expect("to_string"));
    }
    return ret_vec;
}

#[tauri::command]
async fn dnduploader_termbin(filepath: String) -> Vec<u8> {
    return dnduploaders::termbin(filepath).await;
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            connect,
            user_db_init,
            user_db_log_message,
            user_db_latest_channel_lines,
            dnduploader_termbin,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
