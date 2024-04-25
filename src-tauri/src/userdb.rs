use bitflags::bitflags;
use rusqlite::{Connection, Result};
use serde::*;

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

// ideally this should return `conn` which all the other functions will take as a param
// because re-opening the DB each time is not great. but it works for now...
pub fn init_db(path: String) -> Result<()> {
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

pub fn add_logging(path: String, log: Logging) -> Result<()> {
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
