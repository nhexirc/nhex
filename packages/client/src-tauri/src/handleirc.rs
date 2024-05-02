use chrono::prelude::*;
use std::time::{SystemTime, UNIX_EPOCH};
use vinezombie::ircmsg::ServerMsg;

pub fn spawn_task(
    app_handle: tauri::AppHandle,
    server: String,
    mut stream: tokio::sync::mpsc::UnboundedReceiver<ServerMsg<'static>>,
    window: tauri::Window,
) {
    let mut channel_list_count: u64 = 0;
    let user_path_bind = crate::user_db_path(app_handle, "nhex");
    tauri::async_runtime::spawn(async move {
        let user_db_path = user_path_bind.to_str().expect("path");
        while let Some(message) = stream.recv().await {
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

            match message.kind.as_str() {
                "321" => {
                    // Servers should send this, but aren't guaranteed to.
                }
                "322" => {
                    channel_list_count += 1;
                    let ([_, chan, count], Some(topic)) = message.args.split_last() else {
                        continue;
                    };
                    let Some(chan) = chan.to_utf8() else {
                        continue;
                    };
                    let Some(count) = count.to_utf8().and_then(|v| v.parse::<u64>().ok()) else {
                        continue;
                    };
                    let Some(topic) = topic.to_utf8() else {
                        continue;
                    };
                    let _ = crate::userdb::add_channel_list_entry(
                        user_db_path,
                        &server,
                        &chan,
                        count,
                        &topic,
                    );
                }
                "323" => {
                    let _ = crate::userdb::update_channel_list_meta(
                        user_db_path,
                        &server,
                        channel_list_count,
                    );
                    channel_list_count = 0;
                }
                _ => {
                    window
                        .emit(
                            "nhex://irc_message",
                            super::IRCMessage {
                                server: server.as_str(),
                                message: message.to_string(),
                                timestamp: now_since_epoch.as_millis(),
                            },
                        )
                        .expect("cannot emit irc_message");
                }
            }
        }
    });
}
