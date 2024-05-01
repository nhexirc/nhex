use bitflags::bitflags;
use rusqlite::{Connection, Result};
use serde::*;
use std::time::{SystemTime, UNIX_EPOCH};

bitflags! {
    #[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
    pub struct LoggingFlags: u32 {
        const none = 0x0;
        const from_server = 0x1;
        const from_us = 0x2;
        const highlighted_us = 0x4;
    }
}

#[derive(Debug, Deserialize)]
pub struct Logging {
    network: String,
    target: Option<String>,
    command: String,
    nickname: String,
    ident: String,
    hostname: String,
    message: String,
    time_unix_ms: i64,
    from_server: bool,
    from_us: bool,
    highlighted_us: bool,
}

// ideally these init_db_* functions should return `conn` which all the other functions will take as a param
// because re-opening the DB each time is not great. but it works for now...
pub fn init_logging_db(path: &str) -> Result<()> {
    let conn = Connection::open(path)?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS logging (
            network TEXT NOT NULL,
            target TEXT,
            command TEXT NOT NULL,
            nickname TEXT NOT NULL,
            ident TEXT NOT NULL,
            hostname TEXT NOT NULL,
            message TEXT NOT NULL,
            time_unix_ms INTEGER NOT NULL,
            nhex_flags INTEGER NOT NULL
        )",
        (),
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_logging_message ON logging (network, target, command, message)",
        (),
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_logging_user ON logging (network, nickname, ident, hostname)",
        (),
    )?;
    conn.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS u_idx_logging_message ON logging (
            network, target, command, message, nickname, ident, hostname, time_unix_ms
        )",
        (),
    )?;

    Ok(())
}

pub fn init_user_db(path: &str) -> Result<()> {
    let conn = Connection::open(path)?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS channel_list_meta (
          network TEXT NOT NULL UNIQUE ON CONFLICT REPLACE,
          channel_count INTEGER NOT NULL,
          updated_time_unix_ms INTEGER NOT NULL
        )",
        (),
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS channel_list_entry (
        network TEXT NOT NULL,
        name TEXT NOT NULL,
        user_count INTEGER NOT NULL,
        topic TEXT,
        UNIQUE(network, name) ON CONFLICT REPLACE
    )",
        (),
    )?;

    conn.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS u_idx_channel_list_entry ON channel_list_entry (name, network)",
        (),
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_channel_list_topic ON channel_list_entry (name, topic)",
        (),
    )?;

    Ok(())
}

pub fn logging_to_flags(log: &Logging) -> LoggingFlags {
    let mut ret: LoggingFlags = LoggingFlags::none;

    if log.from_us == true {
        ret = ret | LoggingFlags::from_us;
    }

    if log.from_server == true {
        ret = ret | LoggingFlags::from_server;
    }

    if log.highlighted_us == true {
        ret = ret | LoggingFlags::highlighted_us;
    }

    return ret;
}

pub fn add_logging(path: &str, log: Logging) -> Result<()> {
    let conn = Connection::open(path)?;

    conn.execute(
        "INSERT INTO logging VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        (
            &log.network,
            &log.target,
            &log.command,
            &log.nickname,
            &log.ident,
            &log.hostname,
            &log.message,
            &log.time_unix_ms,
            logging_to_flags(&log).bits(),
        ),
    )?;

    Ok(())
}

pub fn update_channel_list_meta(path: &str, network: &str, count: u64) -> Result<()> {
    let conn = Connection::open(path)?;
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("time")
        .as_millis();

    conn.execute(
        "INSERT OR REPLACE INTO channel_list_meta VALUES (?1, ?2, ?3)",
        (network, count, now as u64),
    )?;

    Ok(())
}

pub fn add_channel_list_entry(
    path: &str,
    network: &str,
    name: &str,
    user_count: u64,
    topic: &str,
) -> Result<()> {
    let conn = Connection::open(path)?;

    conn.execute(
        "INSERT OR REPLACE INTO channel_list_entry VALUES (?1, ?2, ?3, ?4)",
        (network, name, user_count, topic),
    )?;

    Ok(())
}
