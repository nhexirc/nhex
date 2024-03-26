import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { emit, listen } from '@tauri-apps/api/event';
import { parse } from 'irc-message';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from './shadcn/Resizable';
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

const BUFFERS: Record<string, NetworkBuffer> = {};
let CUR_SELECTION: SACSelect = { server: "", channel: "" };

function messageBoxLinesFromBuffer(buffer: Buffer, currentNick: string): MessageBoxLines {
  return buffer.buffer.map((parsed: IRCMessageParsed) => ({
    message: parsed,
    isUs: currentNick === parsed.prefix,
  }));
}

export default function MainView() {
  const [nick, setNick] = useState("");
  const [server, setServer] = useState("");
  const [port, setPort] = useState("");
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
          names: new Set()
        },
        ...channels.split(" ").reduce((a, chan) => ({
          [chan]: {
            name: chan,
            buffer: [],
            names: new Set()
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

      const { currentBuffer } = messageParser(networkBuffers, parse(event.payload.message));

      if (event.payload.server === CUR_SELECTION.server && currentBuffer.name === CUR_SELECTION.channel) {
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
      port: Number.parseInt(port),
      channels: channels.split(" ")
    });
  }

  return (
    <div className="container" id="connectbox_container">
      <form
        className="row"
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
          id="server-input"
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
          id="channels"
          onInput={(e) => setChannels(e.currentTarget.value)}
          placeholder="Channels, space separated"
        />
        <button
          type="submit"
          onClick={(e) => (e.currentTarget.style.display = 'none')}
        >Connect</button>
      </form>

      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={15}>
          <div>
            <ServersAndChans servers={serversAndChans} />
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={70}>
          <MessageBox lines={messageBoxLines} />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={15}>
          <div>
            <ChannelNames names={channelNames} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
