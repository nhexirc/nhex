use rusqlite::{Connection, Result};
use serde::*;

#[derive(Debug, Deserialize)]
pub struct Logging {
    network: String,
    target: Option<String>,
    command: String,
    nickname: String,
    ident: String,
    hostname: String,
    message: String,
    raw: Option<String>,
    time_unix_ms: i64,
    from_server: Option<bool>,
    from_us: Option<bool>,
    highlighted_us: Option<bool>,
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
            raw TEXT,
            time_unix_ms INTEGER NOT NULL,
            from_server INTEGER,
            from_us INTEGER,
            highlighted_us INTEGER
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
            network, target, command, message, nick, ident, hostname time_unix_ms
        )",
        (),
    )?;

    Ok(())
}

pub fn add_logging(path: String, log: Logging) -> Result<()> {
    let conn = Connection::open(path)?;

    conn.execute(
        "INSERT INTO logging VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        (
            &log.network,
            &log.target,
            &log.command,
            &log.nickname,
            &log.ident,
            &log.hostname,
            &log.message,
            &log.raw,
            &log.time_unix_ms,
            &log.from_server,
            &log.from_us,
            &log.highlighted_us,
        ),
    )?;

    Ok(())
}
