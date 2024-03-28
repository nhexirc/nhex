import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { emit, listen } from '@tauri-apps/api/event';
import { parse } from 'irc-message';
import MessageBox from './MessageBox';
import {
  Buffer,
  NetworkBuffer,
  IRCMessageEvent,
  IRCMessageParsed,
  MBUserInputEvent,
  MessageBoxLines
} from './lib/types';
import ServersAndChans from './ServersAndChans';
import { SACServers, SACSelect, SACSelectEvent } from './ServersAndChans';
import messageParser from './lib/messageParser';
import ChannelNames from './ChannelNames';
import IRCNicksSet from './lib/IRCNicksSet';

const BUFFERS: Record<string, NetworkBuffer> = {};
let CUR_SELECTION: SACSelect = { server: "", channel: "" };

function messageBoxLinesFromBuffer(buffer: Buffer, currentNick: string): MessageBoxLines {
  return buffer.buffer.map((parsed: IRCMessageParsed) => ({
    message: parsed,
    isUs: currentNick === parsed.prefix,
  }));
}

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

export default function MainView() {
  const [nick, setNick] = useState("");
  const [server, setServer] = useState("");
  const [port, setPort] = useState("");
  const [tls, setTLS] = useState(false);
  const [channels, setChannels] = useState("");
  const [messageBoxLines, setMessageBoxLines] = useState<MessageBoxLines>([]);
  const [serversAndChans, setServersAndChans] = useState<SACServers>({});
  const [channelNames, setChannelNames] = useState<Set<string>>(new Set());

  async function connect() {
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

      let { currentBuffer } = messageParser(networkBuffers, parse(event.payload.message));

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

      setServersAndChans(Object.fromEntries(Object.entries(BUFFERS).map(([server, netBuffs]) => (
        [server, Object.keys(netBuffs.buffers).filter((c) => c !== "")]
      ))));
    });

    await listen("nhex://servers_and_chans/select", (event: SACSelectEvent) => {
      const { server, channel } = event.payload;
      CUR_SELECTION = { server, channel };
      const channelBuf = BUFFERS[server].buffers[channel];
      setMessageBoxLines(messageBoxLinesFromBuffer(channelBuf, nick));
      setChannelNames(channelBuf.names);
      emit("nhex://servers_and_chans/selected", CUR_SELECTION);
    });

    await listen("nhex://user_input/raw", (event: MBUserInputEvent) => {
      if (event.payload.command.toLowerCase() === "privmsg") {
        BUFFERS[CUR_SELECTION.server].buffers[CUR_SELECTION.channel].buffer.push({
          command: event.payload.command,
          params: [CUR_SELECTION.channel, ...event.payload.args],
          prefix: nick, ///TODO: this better
          raw: event.payload.raw,
          tags: {}
        });

        emit("nhex://servers_and_chans/select", CUR_SELECTION);
      }

      emit("nhex://user_input", { ...CUR_SELECTION, ...event.payload });
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

  return (
    <div className="flex flex-col mx-auto max-w-4xl">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          connect();
        }}
      >
        <input
          id="nick-input"
          onInput={(e) => setNick(e.currentTarget.value)}
          placeholder="Nickname"
        />
        <input
          id="server-input"
          onInput={(e) => setServer(e.currentTarget.value)}
          placeholder="Server"
        />
        <input
          id="port-input"
          onInput={(e) => {
            const intVal = Number.parseInt(e.currentTarget.value);
            if (!Number.isNaN(intVal) && Number.isInteger(intVal) && intVal < 65536) {
              setPort(e.currentTarget.value);
            }
            else {
              e.currentTarget.value = port;
            }
          }}
          placeholder="Port"
        />
        <input
          id="tls-input"
          type="checkbox"
          checked={tls}
          onChange={(e) => setTLS(!tls)}
        /> <label htmlFor="tls-input">Use TLS</label>
        <input
          id="channels"
          onInput={(e) => setChannels(e.currentTarget.value)}
          placeholder="Channels, space separated"
        />
        <button
          type="submit"
          onClick={(e) => (e.currentTarget.style.display = 'none')}
        >Connect</button>
      </form>

      <div className="flex">
        <ServersAndChans servers={serversAndChans} />
        <MessageBox lines={messageBoxLines} />
        <ChannelNames names={channelNames} />
      </div>
    </div>
  );
}
