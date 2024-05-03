// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod dnduploaders;
mod handleirc;
mod userdb;
mod userinput;

use userinput::*;

use serde::Serialize;
use std::path::PathBuf;
use tauri::{async_runtime, Manager, Window};

use vinezombie::{client as vzc, string::*};

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
) -> Result<(), std::io::Error> {
    let mut address = vzc::conn::ServerAddr::from_host(server.clone())?;
    let options = vzc::register::Options::<()> {
        pass: None,
        nicks: vec![Nick::from_bytes(nick)?],
        // When nhex works out how to do passwords, uncomment this:
        /*
        sasl: vec![vzc::auth::AnySasl::Password(vzc::auth::sasl::Password::new(
            username.try_into()?, Secret::new(password.try_into()?)
        ))],
        */
        ..Default::default()
    };
    address.port = Some(port);
    address.tls = tls;
    let sock = address
        .connect_tokio(|| vzc::tls::TlsConfigOptions::default().build())
        .await?;
    let mut client = vzc::Client::new(sock, vzc::channel::TokioChannels);
    // TOOD: Can nhex actually tolerate the caps r_a_c requests by default?
    let (_id, reg_result) = client
        .add(&vzc::register::register_as_client(), &options)
        .unwrap();
    client.run_tokio().await?;
    // Shouldn't panic because the handler will always emit the error in failure.
    reg_result.await.unwrap()?;
    let _ = client.add((), vzc::handlers::AutoPong);
    // Application logic past this point.
    let (sender, mut cmd_queue) = tokio::sync::mpsc::unbounded_channel::<Command>();
    let ack_handle = app_handle.app_handle();
    let server_name = server.clone();
    // Receive events from the frontend and queue commands.
    app_handle.listen_global(EVENT_PATH_INPUT, move |event| {
        let cmd = deserde(event);
        if !cmd.server.is_empty() && cmd.server != server_name {
            return;
        }
        let id = cmd.id;
        let command = cmd.command.clone();
        // TODO: send_to might return `Ok(false)` if the connection shut down.
        let result = UserInputResult {
            id,
            server: &server_name,
            error: cmd.send_to(&sender).err(),
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

    let (_, stream) = client.add((), vzc::handlers::YieldAll).unwrap();
    handleirc::spawn_task(app_handle, server, stream, window);
    while !cmd_queue.is_closed() || client.needs_run() {
        tokio::select! {
            biased;
            Some(cmd) = cmd_queue.recv() => {
                cmd.run(&mut client);
                // Since we're here, fully drain the queue.
                while let Ok(cmd) = cmd_queue.try_recv() {
                    cmd.run(&mut client);
                }
            }
            result = client.run_tokio(), if client.needs_run() => {
                if result?.is_none() {
                    // TODO: Read timeout.
                    // Store the channel from the previous ping handler.
                    // If it doesn't exist or succeeded, add a ping handler.
                    // If it failed, flee.
                    // Probably won't have to do this in a future breaking version of vinezombie.
                }
            }
        }
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
        num_lines,
    )
    .expect("get_latest_channel_lines");

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
