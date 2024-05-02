use std::collections::VecDeque;

use tokio::sync::mpsc::UnboundedSender;
use vinezombie::{
    client::{channel::TokioChannels, Client},
    ircmsg::ClientMsg,
    string::{Arg, Line, Nick},
};

/// Named to match the corresponding interface on the TS side.
#[derive(serde::Serialize, serde::Deserialize)]
#[allow(non_snake_case)]
pub struct UserInput {
    #[serde(default)] // Not always present, so default to 0 when it's not.
    pub id: u32,
    pub server: String,
    pub channel: String,
    pub command: String,
    pub args: VecDeque<String>,
    pub argsStr: String,
}

#[derive(Clone, serde::Serialize)]
#[serde(tag = "type")]
pub enum UserInputError {
    UnknownCmd,
    MissingArg,
    Io { info: String },
    Other { info: String },
}

/// Commands to run on the vinezombie Client.
pub enum Command {
    Send(ClientMsg<'static>),
    // TODO: Keyed join.
    Join(Vec<Arg<'static>>),
    Msg(Arg<'static>, Line<'static>),
}

impl Command {
    pub fn run<C>(self, client: &mut Client<C, TokioChannels>) {
        use vinezombie::string::Builder;
        // 350 chosen as an arbitrary safe value for the soft maximum argument array length.
        const LIMIT: usize = 350;
        match self {
            Command::Send(msg) => {
                client.queue_mut().edit().push(msg);
            }
            Command::Join(chans) => {
                // TODO: Whenver vinezombie gets a Join handler, use that.
                let mut iter = chans.into_iter();
                let Some(target) = iter.next() else {
                    return;
                };
                let mut queue = client.queue_mut().edit();
                let mut builder = Builder::<Arg<'static>>::new(target);
                for target in iter {
                    if builder.len() + target.len() > LIMIT {
                        let mut msg = ClientMsg::new(vinezombie::names::cmd::JOIN);
                        // Hey, what happens when the channel name we want to join is 350B+ long?
                        // Well, for now, let's pretend that absurd case won't happen.
                        let targets = std::mem::replace(&mut builder, Builder::new(target));
                        msg.args.edit().add_word(targets.build());
                        queue.push(msg);
                    } else {
                        let _ = builder.try_push_char(',');
                        builder.append(target);
                    }
                }
                let mut msg = ClientMsg::new(vinezombie::names::cmd::JOIN);
                msg.args.edit().add_word(builder.build());
                queue.push(msg);
            }
            Command::Msg(target, body) => {
                // TODO: Whenever vinezombie gets a SendMsg handler, use that.
                let mut msg = ClientMsg::new(vinezombie::names::cmd::PRIVMSG);
                // We could do message splitting here with unicode-segmentation.
                let mut args = msg.args.edit();
                args.add_word(target);
                args.add(body);
                client.queue_mut().edit().push(msg);
            }
        }
    }
}

impl From<vinezombie::error::InvalidString> for UserInputError {
    fn from(value: vinezombie::error::InvalidString) -> Self {
        UserInputError::Other {
            info: value.to_string(),
        }
    }
}

impl UserInput {
    pub fn send_to(mut self, sender: &UnboundedSender<Command>) -> Result<bool, UserInputError> {
        // TODO: Limits, throughout. Message length, target limits.
        let channel = Arg::from_bytes(self.channel).expect("client requested invalid channel");
        Ok(match self.command.as_str() {
            "" => sender
                .send(Command::Msg(channel, Line::from_bytes(self.argsStr)?))
                .is_ok(),
            "join" => {
                // Quietly discard invalid channel names for now.
                // Going loud is also an option.
                let target = self
                    .args
                    .into_iter()
                    .filter_map(|v| Arg::from_bytes(v).ok())
                    .collect();
                sender.send(Command::Join(target)).is_ok()
            }
            "msg" => {
                let target = self.args.pop_front().ok_or(UserInputError::MissingArg)?;
                let msg = Line::from_bytes(self.args.make_contiguous().join(" "))?;
                sender
                    .send(Command::Msg(Arg::from_bytes(target)?, msg))
                    .is_ok()
            }
            "nick" => {
                let new_nick = self.args.pop_front().ok_or(UserInputError::MissingArg)?;
                let mut msg = ClientMsg::new(vinezombie::names::cmd::NICK);
                msg.args.edit().add_word(Nick::from_bytes(new_nick)?);
                sender.send(Command::Send(msg)).is_ok()
            }
            "part" => {
                let target = self.args.pop_front().ok_or(UserInputError::MissingArg)?;
                let part_msg = Line::from_bytes(self.args.make_contiguous().join(" "))?;
                let mut msg = ClientMsg::new(vinezombie::names::cmd::PART);
                let mut args = msg.args.edit();
                args.add_word(Arg::from_bytes(target)?);
                if part_msg.is_empty() {
                    args.add(Line::from_str(super::VERSION_STRING));
                } else {
                    args.add(part_msg);
                }
                sender.send(Command::Send(msg)).is_ok()
            }
            "quit" => {
                let quit_msg = Line::from_bytes(self.args.make_contiguous().join(" "))?;
                let mut msg = ClientMsg::new(vinezombie::names::cmd::PART);
                let mut args = msg.args.edit();
                if quit_msg.is_empty() {
                    args.add(Line::from_str(super::VERSION_STRING));
                } else {
                    args.add(quit_msg);
                }
                sender.send(Command::Send(msg)).is_ok()
            }
            "stats" => {
                let query = self.args.pop_front().ok_or(UserInputError::MissingArg)?;
                let server = self.args.pop_front();
                let mut msg = ClientMsg::new(vinezombie::names::cmd::STATS);
                let mut args = msg.args.edit();
                args.add_word(Arg::from_bytes(query)?);
                if let Some(server) = server {
                    args.add_word(Arg::from_bytes(server)?);
                }
                sender.send(Command::Send(msg)).is_ok()
            }
            "whois" => {
                let p0 = self.args.pop_front();
                let p1 = self.args.pop_front();
                let (server, nick) = match (p0, p1) {
                    (Some(server), Some(nick)) => {
                        (Some(Arg::from_bytes(server)?), Arg::from_bytes(nick)?)
                    }
                    (Some(nick), _) => (None, Arg::from_bytes(nick)?),
                    _ => return Err(UserInputError::MissingArg),
                };
                let mut msg = ClientMsg::new(vinezombie::names::cmd::STATS);
                let mut args = msg.args.edit();
                if let Some(server) = server {
                    args.add_word(server);
                }
                args.add_word(nick);
                sender.send(Command::Send(msg)).is_ok()
            }
            "list" => {
                let msg = ClientMsg::new(vinezombie::names::cmd::LIST);
                // TODO: How badly would supporting the LIST arguments break client assumptions?
                /*
                let mut args = msg.args.edit();
                if let Some(p0) = self.args.pop_front() {
                    args.add_word(Arg::from_bytes(p0)?);
                }
                if let Some(p1) = self.args.pop_front() {
                    args.add_word(Arg::from_bytes(p1)?);
                }
                */
                sender.send(Command::Send(msg)).is_ok()
            }
            _c => {
                // TODO: Report user error.
                true
            }
        })
    }
}

/// Parses a [`UserInput`] from JSON. Panics on invalid data.
pub fn deserde(event: tauri::Event) -> UserInput {
    let payload = event.payload().expect("missing payload in event");
    serde_json::from_str(payload).expect("non-json payload in event")
}
