/// Named to match the corresponding interface on the TS side.
#[derive(serde::Serialize, serde::Deserialize)]
#[allow(non_snake_case)]
pub struct UserInput {
    #[serde(default)] // Not always present, so default to 0 when it's not.
    pub id: u32,
    pub server: String,
    pub channel: String,
    pub command: String,
    pub args: Vec<String>,
    pub argsStr: String,
}

#[derive(Clone, serde::Serialize)]
#[serde(tag = "type")]
pub enum UserInputError {
    MissingArg,
    Io { info: String },
    Other { info: String },
}

impl From<irc::error::Error> for UserInputError {
    fn from(value: irc::error::Error) -> Self {
        match value {
            irc::error::Error::Io(e) => UserInputError::Io {
                info: e.to_string(),
            },
            irc::error::Error::Tls(e) => UserInputError::Io {
                info: e.to_string(),
            },
            irc::error::Error::PingTimeout => UserInputError::Io {
                info: "ping timeout".to_owned(),
            },
            other => UserInputError::Other {
                info: other.to_string(),
            },
        }
    }
}

impl UserInput {
    pub fn run(self, sender: &irc::client::Sender) -> Result<(), UserInputError> {
        use irc::proto::Command;
        // TODO: Limits, throughout. Message length, target limits.
        match self.command.as_str() {
            "" => sender.send_privmsg(self.channel, self.argsStr)?,
            "join" => {
                // TODO: Join with keys.
                sender.send_join(self.args.join(","))?;
            }
            "msg" => {
                let (target, rest) = self.args.split_first().ok_or(UserInputError::MissingArg)?;
                let msg = rest.join(" ");
                sender.send_privmsg(target, msg)?;
            }
            "nick" => {
                let (new_nick, _) = self.args.split_first().ok_or(UserInputError::MissingArg)?;
                sender.send(Command::NICK(new_nick.clone()))?;
            }
            "part" => {
                let (target, rest) = self.args.split_first().ok_or(UserInputError::MissingArg)?;
                // There should be empty arguments in this list to indicate consecutive spaces.
                let msg = rest.join(" ");
                let nonempty = !msg.is_empty();
                sender.send(Command::PART(target.clone(), nonempty.then_some(msg)))?;
            }
            "quit" => {
                let quit_msg = if !self.argsStr.is_empty() {
                    self.argsStr
                } else {
                    super::VERSION_STRING.to_owned()
                };
                sender.send_quit(quit_msg)?;
            }
            "stats" => {
                let (p0, p1) = match self.args.as_slice() {
                    [] => (None, None),
                    [p0] => (Some(p0.clone()), None),
                    [p0, p1, ..] => (Some(p0.clone()), Some(p1.clone())),
                };
                sender.send(Command::STATS(p0, p1))?;
            }
            "whois" => {
                let (target, rest) = self.args.split_first().ok_or(UserInputError::MissingArg)?;
                sender.send(Command::WHOIS(rest.first().cloned(), target.clone()))?;
            }
            "list" => {
                sender.send(Command::LIST(None, None))?;
            }
            c => panic!("unknown command {c}",), // TODO: Gracefully error on this.
        }
        Ok(())
    }
}

/// Parses a [`UserInput`] from JSON. Panics on invalid data.
pub fn deserde(event: tauri::Event) -> UserInput {
    let payload = event.payload().expect("missing payload in event");
    serde_json::from_str(payload).expect("non-json payload in event")
}
