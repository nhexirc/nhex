import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { emit, listen } from '@tauri-apps/api/event';
import { parse } from 'irc-message';
import {
  Buffer,
  NetworkBuffer,
  IRCMessageEvent,
  IRCMessageParsed,
  MBUserInputEvent,
  MessageBoxLines
} from './lib/types';
import { SACServers, SACSelect, SACSelectEvent } from './ServersAndChans';
import messageParser from './lib/messageParser';
import IRCNicksSet from './lib/IRCNicksSet';
import { CONNECT_STYLE, IRC_STYLE } from "./style";
import IRC from "./IRC";
import Connect from "./Connect";


const BUFFERS: Record<string, NetworkBuffer> = {};
let CUR_SELECTION: SACSelect = { server: "", channel: "" };

// try to complete nickname
export const completeNickname = (prefix: string, skipFrom: string): string => {
  const { server, channel } = CUR_SELECTION;
  // for comparison
  const lcPrefix = prefix.toLowerCase();
  const names = [...BUFFERS[server].buffers[channel].names].sort();
  // we want to cycle through completions
  const sliceFrom = skipFrom.endsWith(":")
    ? names.findIndex(name =>
      name.toLowerCase() === skipFrom.toLowerCase().slice(0, -1)) + 1
    : 0;
  const relevantNames = names.slice(sliceFrom);
  const found = relevantNames.find(name =>
    name.toLowerCase().startsWith(lcPrefix));

  return found ? `${found}: ` : prefix;
}

const MainView = () => {
  const [nick, setNick] = useState("");
  const [server, setServer] = useState("");
  const [port, setPort] = useState("");
  const [tls, setTLS] = useState(true);
  const [channels, setChannels] = useState("");
  const [messageBoxLines, setMessageBoxLines] = useState<MessageBoxLines>([]);
  const [serversAndChans, setServersAndChans] = useState<SACServers>({});
  const [channelNames, setChannelNames] = useState<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(false);


  function messageBoxLinesFromBuffer(buffer: Buffer, currentNick: string): MessageBoxLines {
    return buffer.buffer.map((parsed: IRCMessageParsed) => ({
      message: parsed,
      isUs: currentNick === parsed.prefix,
    }));
  }

  const refreshServersAndChans = () => {
    setServersAndChans(Object.fromEntries(Object.entries(BUFFERS).map(([server, netBuffs]) => (
      [server, Object.keys(netBuffs.buffers).filter((c) => c !== "")]
    ))));
  }

  async function connect(e: any) {
    e.preventDefault();
    setIsConnected(true)
    console.log('connect!', nick, server, port, channels);
    CUR_SELECTION.server = server;

    BUFFERS[server] = {
      server, buffers: {
        "": {
          name: "",
          buffer: [],
          names: new IRCNicksSet()
        },
        ...channels.split(" ").reduce((a, chan) => ({
          [chan]: {
            name: chan,
            buffer: [],
            names: new IRCNicksSet()
          },
          ...a
        }), {})
      }
    };

    const networkBuffers = BUFFERS[server].buffers;

    await listen('nhex://irc_message', (event: IRCMessageEvent) => {
      if (event.payload.server !== server) {
        return;
      }

      let { currentBuffer, parsed } = messageParser(networkBuffers, parse(event.payload.message));

      if (!currentBuffer) {
        // messageParser will return null if it didn't add the message to any buffer (e.g. a JOIN that
        // was handled to adjust channel names list but isn't to be printed in the message box), but we
        // still want to refresh the user's current message box view
        currentBuffer = BUFFERS[CUR_SELECTION.server].buffers[CUR_SELECTION.channel];
      }

      if (currentBuffer && event.payload.server === CUR_SELECTION.server && currentBuffer.name === CUR_SELECTION.channel) {
        setMessageBoxLines(messageBoxLinesFromBuffer(currentBuffer, nick));
        setChannelNames(currentBuffer.names);
        emit("nhex://servers_and_chans/selected", CUR_SELECTION);
      }

      refreshServersAndChans();
    });

    await listen("nhex://servers_and_chans/select", (event: SACSelectEvent) => {
      const { server, channel } = event.payload;
      CUR_SELECTION = { server, channel };
      const channelBuf = BUFFERS[server].buffers[channel];
      setMessageBoxLines(messageBoxLinesFromBuffer(channelBuf, nick));
      setChannelNames(channelBuf.names);
      emit("nhex://servers_and_chans/selected", CUR_SELECTION);
    });

    const handlers = {
        privmsg(event: MBUserInputEvent) {
            BUFFERS[CUR_SELECTION.server].buffers[CUR_SELECTION.channel].buffer.push({
              command: "PRIVMSG",
              params: [CUR_SELECTION.channel, ...event.payload.args],
              prefix: nick, ///TODO: this better
              raw: event.payload.raw,
              tags: {}
            });

            emit("nhex://servers_and_chans/select", CUR_SELECTION);
            return "privmsg";
        },
        msg(event: MBUserInputEvent) {
            const pmPartnerNick = event.payload.args[0];
            const messageParams = event.payload.args.slice(1);

            let buf = BUFFERS[CUR_SELECTION.server].buffers[pmPartnerNick];
            if (!buf) {
              buf = BUFFERS[CUR_SELECTION.server].buffers[pmPartnerNick] = new Buffer(pmPartnerNick);
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
        part() {
            return "part";
        },
        whois(event: MBUserInputEvent) {
            return "whois";
        }
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
          emit(`nhex://user_input/${eventName}`, { ...CUR_SELECTION, ...event.payload });
      } else {
          console.warn(`command ${nrmCommand} not supported`);
      }
    });

    invoke("connect", {
      nick,
      server,
      // how to properly handle rust underscore vs. JS camelcase?
      port: Number.parseInt(port),
      tls,
      channels: channels.split(" ")
    });
  }
  const handleTLS = () => {
    setTLS(!tls);
  }

  // will need a disconnect function above with the bool state variable to bring us back to login after disconnecting
  return (
    <>
      {!isConnected ?
        <div className={CONNECT_STYLE} >
          <Connect setNick={setNick} setServer={setServer} setPort={setPort} port={port} handleTLS={handleTLS} tls={tls} setChannels={setChannels} connect={connect} />
        </div>
        :
        <>
          <div className={IRC_STYLE}>
            <IRC servers={serversAndChans} message={messageBoxLines} names={channelNames} />
          </div>
        </>
      }
    </>
  );
}

export default MainView
