import { invoke } from "@tauri-apps/api/tauri";
import { emit, listen } from '@tauri-apps/api/event';
import { parse } from 'irc-message';
import messageParser from './messageParser';
import {
  Buffer,
  IRCMessageEvent,
  IRCMessageParsed,
  MBUserInputEvent,
  MessageBoxLines,
  SACSelectEvent,
} from './types';


function messageBoxLinesFromBuffer(buffer: Buffer, currentNick: string): MessageBoxLines {
  return buffer.buffer.map((parsed: IRCMessageParsed) => ({
    message: parsed,
    isUs: currentNick === parsed.prefix || parsed.prefix.startsWith(currentNick),
  }));
}

export interface ConnectOptions {
  postMotdCallback?: () => Promise<void>;
  loggedInCallback?: () => Promise<void>;
};

export default async function (context: Record<any, any>, options?: ConnectOptions) {
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
    refreshServersAndChans,
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

    let { currentBuffer, parsed } = messageParser(server, networkBuffers, parse(event.payload.message));

    if (parsed.command === "376" /* RPL_ENDOFMOTD */) {
      realSetIsConnected(true);
      console.log('connected!', nick, server, port, channels, isConnected);
      await options?.postMotdCallback();
    }
    else if (parsed.command === "900" /* RPL_LOGGEDIN */) {
      await options?.loggedInCallback();
    }

    if (!currentBuffer) {
      // messageParser will return null if it didn't add the message to any buffer (e.g. a JOIN that
      // was handled to adjust channel names list but isn't to be printed in the message box), but we
      // still want to refresh the user's current message box view
      currentBuffer = BUFFERS[getCurSelection().server].buffers[getCurSelection().channel];
    }

    if (currentBuffer && event.payload.server === getCurSelection().server && currentBuffer.name === getCurSelection().channel) {
      setMessageBoxLines(messageBoxLinesFromBuffer(currentBuffer, nick));
      setChannelNames(currentBuffer.names);
      setTopic(currentBuffer.topic);
      emit("nhex://servers_and_chans/selected", getCurSelection());
    }

    refreshServersAndChans();
  });

  await listen("nhex://servers_and_chans/select", (event: SACSelectEvent) => {
    const { server, channel } = event.payload;
    setCurSelection({ server, channel });
    const channelBuf = BUFFERS[server].buffers[channel];
    setMessageBoxLines(messageBoxLinesFromBuffer(channelBuf, nick));
    setChannelNames(channelBuf.names);
    setTopic(channelBuf.topic);
    emit("nhex://servers_and_chans/selected", getCurSelection());
  });

  const handlers = {
    privmsg(event: MBUserInputEvent) {
      BUFFERS[getCurSelection().server].buffers[getCurSelection().channel].buffer.push({
        command: "PRIVMSG",
        params: [getCurSelection().channel, ...event.payload.args],
        prefix: nick, ///TODO: this better
        raw: event.payload.raw,
        tags: {}
      });

      emit("nhex://servers_and_chans/select", getCurSelection());
      return "privmsg";
    },
    msg(event: MBUserInputEvent) {
      const pmPartnerNick = event.payload.args[0];
      const messageParams = event.payload.args.slice(1);

      let buf = BUFFERS[getCurSelection().server].buffers[pmPartnerNick];
      if (!buf) {
        buf = BUFFERS[getCurSelection().server].buffers[pmPartnerNick] = new Buffer(pmPartnerNick);
      }

      buf.buffer.push({
        command: "PRIVMSG",
        params: [pmPartnerNick, ...messageParams],
        prefix: nick, ///TODO: this better
        raw: messageParams.join(" "),
        tags: {}
      });

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
        setMessageBoxLines(messageBoxLinesFromBuffer(BUFFERS[getCurSelection().server].buffers[""], nick));
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
  };
  const implementedHandlers = Object.keys(handlers);

  listen("nhex://user_input/raw", (event: MBUserInputEvent) => {
    const command = event.payload.command.toLowerCase();
    const nrmCommand = command === "" ? "privmsg" : command;
    if (implementedHandlers.includes(nrmCommand)) {
      // this handles any special logic, could be a noop, and returns the name
      // of the rust event to be called
      const eventName = handlers[nrmCommand](event);
      // inform rust
      emit(`nhex://user_input/${eventName}`, { ...getCurSelection(), ...event.payload });
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
