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
    UnknownCmd { name: String },
    MissingArg { name: &'static str },
    InvalidArg { name: &'static str, info: String },
}

#[inline]
pub fn make_line(value: String) -> Line<'static> {
    Line::from_bytes(value).unwrap()
}
/// Unwraps an optional value into a variable `name`, or returns an error.
macro_rules! let_some {
    ($name:ident = $xp:expr) => {
        let $name = ($xp).ok_or(UserInputError::MissingArg {
            name: stringify!($name),
        })?;
    };
}
/// Tries to convert the variable named `name` into the vinezombie string type `string`,
/// and returns an error on failure.
macro_rules! check {
    ($name:ident: $string:ty) => {
        <$string>::from_bytes($name).map_err(|e| UserInputError::InvalidArg {
            name: stringify!($name),
            info: e.to_string(),
        })?
    };
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

impl UserInput {
    /// Sends a user-provided command to the provided channel.
    ///
    /// # Panics
    /// This function assumes that the frontend will never allow the user to attempt to send
    /// containing `'\r'`, `'\n'`, or `'\0'`, and will panic otherwise.
    pub fn send_to(mut self, sender: &UnboundedSender<Command>) -> Result<bool, UserInputError> {
        // TODO: Limits, throughout. Message length, target limits.
        let channel = Arg::from_bytes(self.channel).expect("frontend requested invalid channel");
        let to_send = match self.command.as_str() {
            "" => Command::Msg(channel, make_line(self.argsStr)),
            "join" => {
                // Quietly discard invalid channel names for now.
                // Going loud is also an option.
                let target = self
                    .args
                    .into_iter()
                    .filter_map(|v| Arg::from_bytes(v).ok())
                    .collect();
                Command::Join(target)
            }
            "msg" => {
                let_some!(target = self.args.pop_front());
                let msg = make_line(self.args.make_contiguous().join(" "));
                Command::Msg(check!(target: Arg), msg)
            }
            "nick" => {
                let_some!(nick = self.args.pop_front());
                let mut msg = ClientMsg::new(vinezombie::names::cmd::NICK);
                msg.args.edit().add_word(check!(nick: Nick));
                Command::Send(msg)
            }
            "part" => {
                let_some!(channel = self.args.pop_front());
                let part_msg = make_line(self.args.make_contiguous().join(" "));
                let mut msg = ClientMsg::new(vinezombie::names::cmd::PART);
                let mut args = msg.args.edit();
                args.add_word(check!(channel: Arg));
                if part_msg.is_empty() {
                    args.add(Line::from_str(super::VERSION_STRING));
                } else {
                    args.add(part_msg);
                }
                Command::Send(msg)
            }
            "quit" => {
                let quit_msg = make_line(self.args.make_contiguous().join(" "));
                let mut msg = ClientMsg::new(vinezombie::names::cmd::PART);
                let mut args = msg.args.edit();
                if quit_msg.is_empty() {
                    args.add(Line::from_str(super::VERSION_STRING));
                } else {
                    args.add(quit_msg);
                }
                Command::Send(msg)
            }
            "stats" => {
                let_some!(query = self.args.pop_front());
                let server = self.args.pop_front();
                let mut msg = ClientMsg::new(vinezombie::names::cmd::STATS);
                let mut args = msg.args.edit();
                args.add_word(check!(query: Arg));
                if let Some(server) = server {
                    args.add_word(check!(server: Arg));
                }
                Command::Send(msg)
            }
            "whois" => {
                let p0 = self.args.pop_front();
                let p1 = self.args.pop_front();
                let (server, nick) = match (p0, p1) {
                    (Some(server), Some(nick)) => (Some(check!(server: Arg)), check!(nick: Nick)),
                    (Some(nick), _) => (None, check!(nick: Nick)),
                    _ => return Err(UserInputError::MissingArg { name: "nick" }),
                };
                let mut msg = ClientMsg::new(vinezombie::names::cmd::STATS);
                let mut args = msg.args.edit();
                if let Some(server) = server {
                    args.add_word(server);
                }
                args.add_word(nick);
                Command::Send(msg)
            }
            "list" => {
                let mut msg = ClientMsg::new(vinezombie::names::cmd::LIST);
                let mut args = msg.args.edit();
                if let Some(p0) = self.args.pop_front() {
                    args.add_word(check!(p0: Arg));
                }
                if let Some(p1) = self.args.pop_front() {
                    args.add_word(check!(p1: Arg));
                }
                Command::Send(msg)
            }
            _ => return Err(UserInputError::UnknownCmd { name: self.command }),
        };
        Ok(sender.send(to_send).is_ok())
    }
}

/// Parses a [`UserInput`] from JSON. Panics on invalid data.
pub fn deserde(event: tauri::Event) -> UserInput {
    let payload = event.payload().expect("missing payload in event");
    serde_json::from_str(payload).expect("non-json payload in event")
}
