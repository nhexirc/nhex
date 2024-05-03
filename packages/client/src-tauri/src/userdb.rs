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

struct LoggingBools {
    from_server: bool,
    from_us: bool,
    highlighted_us: bool,
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

// matches IRCMessageParsed in src/lib/types.ts
// but without "tags"
#[derive(Debug, Deserialize, Serialize)]
#[allow(non_snake_case)]
pub struct IRCMessageParsed {
    command: String,
    params: Vec<String>,
    prefix: String,
    raw: String,
    timestamp: i64,
    fromServer: bool,
    fromUs: bool,
    highlightedUs: bool,
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

fn logging_bools(raw_flags: u32) -> LoggingBools {
    LoggingBools {
        from_us: raw_flags & LoggingFlags::from_us.bits() != 0,
        from_server: raw_flags & LoggingFlags::from_server.bits() != 0,
        highlighted_us: raw_flags & LoggingFlags::highlighted_us.bits() != 0,
    }
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

pub fn get_latest_channel_lines(
    path: &str,
    network: String,
    channel: String,
    num_lines: u64,
) -> Result<Vec<IRCMessageParsed>> {
    let conn = Connection::open(path)?;
    let mut statement = conn.prepare_cached(
        "SELECT command, nickname, ident, hostname, message, time_unix_ms, nhex_flags
        FROM logging WHERE network = ?1 AND target = ?2 AND
        (command = 'PRIVMSG' OR command = 'ACTION')
        ORDER BY time_unix_ms DESC LIMIT ?3",
    )?;

    let parsed_rows = statement.query_map((network, channel.to_string(), num_lines), |row| {
        let msg_raw = row.get_unwrap::<usize, String>(4);
        let msg_vec = msg_raw.split_ascii_whitespace().collect::<Vec<&str>>();
        let msg = msg_vec[1..].join(" ");
        let bools = logging_bools(row.get_unwrap::<usize, u32>(6));
        Ok(IRCMessageParsed {
            command: row.get_unwrap(0),
            params: vec![channel.to_string(), msg],
            prefix: format!(
                "{}!{}@{}",
                row.get_unwrap::<usize, String>(1),
                row.get_unwrap::<usize, String>(2),
                row.get_unwrap::<usize, String>(3)
            ),
            raw: "".to_string(), // TODO: fix? not really necessary...
            timestamp: row.get_unwrap(5),
            fromUs: bools.from_us,
            fromServer: bools.from_server,
            highlightedUs: bools.highlighted_us,
        })
    })?;

    let mut ret_vec = Vec::new();
    for parsed in parsed_rows {
        ret_vec.push(parsed?);
    }
    ret_vec.reverse();

    Ok(ret_vec)
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
