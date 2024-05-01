import { invoke } from "@tauri-apps/api/tauri";
import { emit, listen } from '@tauri-apps/api/event';
import messageParser from './messageParser';
import {
  Buffer,
  IRCMessageEvent,
  IRCMessageParsed,
  MBUserInputEvent,
  MessageBoxLines,
  SACSelectEvent,
} from './types';
import { nickFromPrefix } from './common';
import UserDB from './userDB';

function messageBoxLinesFromBuffer(buffer: Buffer): MessageBoxLines {
  return buffer.buffer.map((parsed: IRCMessageParsed) => ({ message: parsed }));
}

export interface ConnectOptions {
  postMotdCallback?: () => Promise<void>;
  loggedInCallback?: () => Promise<void>;
};

export default async function (context: Record<any, any>, db: UserDB, options?: ConnectOptions) {
  const {
    nick,
    server,
    port,
    channels,
    tls,
    isConnected,
    realSetIsConnected,
    getCurSelection,
    setCurSelection,
    BUFFERS,
    STATE,
    setMessageBoxLines,
    setChannelNames,
    setTopic,
    setNick,
    refreshServersAndChans,
    getUserSettings,
  } = context;

  console.log('connect...', nick, server, port, channels, isConnected);
  getCurSelection().server = server;

  BUFFERS[server] = {
    server, buffers: {
      "": new Buffer(""),
      ...channels.split(" ").reduce((a, chan) => ({
        [chan]: new Buffer(chan),
        ...a
      }), {})
    }
  };

  const networkBuffers = BUFFERS[server].buffers;

  await listen('nhex://irc_message', async (event: IRCMessageEvent) => {
    if (event.payload.server !== server) {
      return;
    }

    const userSettings = getUserSettings();

    let { currentBuffer, parsed } = messageParser(
      server,
      networkBuffers,
      event,
      STATE.nick,
      userSettings
    );

    if (getUserSettings()?.Logging?.enable) {
      db.log_message(server, parsed);
    }

    /* these should _maybe_ all be moved into messageParser() ...?
       but then messageParser will need a *lot* more context params... */
    if (parsed.command === "376" /* RPL_ENDOFMOTD */) {
      realSetIsConnected(true);
      console.log(`connected as "${STATE.nick}"!`, server, port, channels, isConnected);
      STATE.pastMOTD = true;
      await options?.postMotdCallback?.();
    }
    else if (parsed.command === "900" /* RPL_LOGGEDIN */) {
      await options?.loggedInCallback?.();
    }
    else if (parsed.command === "433" /* ERR_NICKNAMEINUSE */) {
      console.warn(`Our chosen nick "${STATE.nick}" was already taken`, parsed);
    }
    // "001" is RPL_WELCOME, "first message sent after client registration"
    else if ((parsed.command === "001" && !STATE.pastMOTD) || (parsed.command.toLowerCase() === "nick" && STATE.pastMOTD)) {
      let [realNick, ...rest] = parsed.params;

      if (parsed.command.toLowerCase() === "nick" && STATE.pastMOTD) {
        if (nickFromPrefix(parsed.prefix) !== STATE.nick) {
          return;
        }

        realNick = realNick.replace("\r\n", "");
      }

      if (realNick !== STATE.nick) {
        console.warn(`Our nick is now: "${realNick}"`, parsed);
        setNick(realNick);
      }
    }

    if (!currentBuffer) {
      // messageParser will return null if it didn't add the message to any buffer (e.g. a JOIN that
      // was handled to adjust channel names list but isn't to be printed in the message box), but we
      // still want to refresh the user's current message box view
      currentBuffer = BUFFERS[getCurSelection().server].buffers[getCurSelection().channel];
    }

    if (currentBuffer) {
      if (event.payload.server === getCurSelection().server && currentBuffer.name === getCurSelection().channel) {
        setMessageBoxLines(messageBoxLinesFromBuffer(currentBuffer));
        setChannelNames(currentBuffer.names);
        setTopic(currentBuffer.topic);
        emit("nhex://servers_and_chans/selected", getCurSelection());
      }
      else {
        let relevantCmd = (parsed.command === 'quit' ? 'part' : parsed.command).toLowerCase();
        if (userSettings?.MessageBox?.show?.includes(relevantCmd) ?? true) {
          currentBuffer.dirty.normal++;

          if (parsed.highlightedUs) {
            currentBuffer.dirty.highlight++;
          }
        }
      }
    }

    refreshServersAndChans();
  });

  await listen("nhex://servers_and_chans/select", (event: SACSelectEvent) => {
    const { server, channel } = event.payload;
    setCurSelection({ server, channel });
    const channelBuf = BUFFERS[server].buffers[channel];
    setMessageBoxLines(messageBoxLinesFromBuffer(channelBuf));
    setChannelNames(channelBuf.names);
    setTopic(channelBuf.topic);
    emit("nhex://servers_and_chans/selected", getCurSelection());
  });

  const handlers = {
    privmsg(event: MBUserInputEvent) {
      BUFFERS[getCurSelection().server].buffers[getCurSelection().channel].buffer.push(new IRCMessageParsed(
        "PRIVMSG",
        [getCurSelection().channel, ...event.payload.args],
        STATE.nick,
        event.payload.raw,
        true,
      ));

      emit("nhex://servers_and_chans/select", getCurSelection());
      // Use an empty string here, as it will never collide with actual command names.
      return "";
    },
    msg(event: MBUserInputEvent) {
      const pmPartnerNick = event.payload.args[0];
      const messageParams = event.payload.args.slice(1);

      let buf = BUFFERS[getCurSelection().server].buffers[pmPartnerNick];
      if (!buf) {
        buf = BUFFERS[getCurSelection().server].buffers[pmPartnerNick] = new Buffer(pmPartnerNick);
      }

      buf.buffer.push(new IRCMessageParsed(
        "PRIVMSG",
        [pmPartnerNick, ...messageParams],
        STATE.nick,
        messageParams.join(" "),
      ));

      refreshServersAndChans();
      return "msg";
    },
    // alias to `join`
    j(event: MBUserInputEvent) {
      return this.join(event);
    },
    join() {
      return "join";
    },
    // alias to `part`
    p(event: MBUserInputEvent) {
      return this.part(event);
    },
    part(event: MBUserInputEvent) {
      let channel = getCurSelection().channel;
      if (event.payload.args.length !== 0) {
        [channel] = event.payload.args;
      } else {
        event.payload.args = [channel];
      }

      if (channel === "") {
        // can't PART the server!
        return null;
      }

      // should probably add - and wait for - and ACK that we actually PART'ed before this?

      delete BUFFERS[getCurSelection().server].buffers[channel];

      if (channel === getCurSelection().channel) {
        getCurSelection().channel = "";
        setMessageBoxLines(messageBoxLinesFromBuffer(BUFFERS[getCurSelection().server].buffers[""]));
      }

      refreshServersAndChans();

      // force override of getCurSelection().channel in the resulting event
      event.payload["channel"] = channel;
      return "part";
    },
    whois(event: MBUserInputEvent) {
      return "whois";
    },
    quit() {
      if (!STATE.connected) {
        return null;
      }

      realSetIsConnected(false);
      return "quit";
    },
    nick(event: MBUserInputEvent) {
      if (event.payload.args.length > 1) {
        console.warn(`Too many args (${event.payload.args.length}) for /nick!`, event.payload.args);
      }
      // do NOT call setNick() here! that will happen by virtue of the NICK message handling path
      return "nick";
    },
    stats() {
      return "stats";
    },
    /* DO NOT uncomment this to expose it to users until /list is rate-limited per the comment below!!
    list() {
      // TODO: only allow refresh every so often! (based on updated_time_unix_ms)
      return "list";
    },
    /**/
  };
  const implementedHandlers = Object.keys(handlers);
  let id = 1; // Start at 1 because the Rust side assumes 0 means "unset".

  listen("nhex://user_input/raw", (event: MBUserInputEvent) => {
    const command = event.payload.command.toLowerCase();
    const nrmCommand = command === "" ? "privmsg" : command;
    if (implementedHandlers.includes(nrmCommand)) {
      // this handles any special logic, could be a noop, and returns the name
      // of the rust event to be called
      const eventName = handlers[nrmCommand](event);
      if (eventName !== null) {
        // Hand off to the Rust side.
        // See `UserInput::run` for where this dispatches to if all goes well.
        emit(`nhex://command/do`, {
          ...getCurSelection(),
          ...event.payload,
          id,
          command: eventName
        });
        id += 1;
      }

      if (getUserSettings()?.Logging?.enable) {
        db.log_message(server, new IRCMessageParsed(
          nrmCommand,
          [getCurSelection().channel, ...event.payload.args],
          STATE.nick,
          event.payload.raw,
          true
        ));
      }
    } else {
      console.warn(`command ${nrmCommand} not supported`);
    }
  });

  return invoke("connect", {
    nick,
    server,
    // how to properly handle rust underscore vs. JS camelcase?
    port: Number.parseInt(port),
    tls,
  });
}
