import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { emit, listen } from '@tauri-apps/api/event';
import { parse } from 'irc-message';
import "./App.css";
import { ScrollArea } from './shadcn/ScrollArea'; // XXX: REMOVE ENTIRELY?
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from './shadcn/Resizable';
import MessageBox from './MessageBox';
import { MBUserInputRaw } from './MessageBox';
import ServersAndChans from './ServersAndChans';
import { SACServers, SACSelect, SACSelectEvent } from './ServersAndChans';

class IRCMessagePayload {
  message: string;
  server: string;
};

class IRCMessageEvent {
  payload: IRCMessagePayload;
};

class IRCMessageParsed {
  command: string;
  params: string[];
  prefix: string;
  raw: string;
  tags: Record<string, any>;
};

class Buffer {
  name: string;
  buffer: IRCMessageParsed[];
};

class NetworkBuffer {
  server: string;
  buffers: Record<string, Buffer>;
};

class MBUserInputEvent {
  payload: MBUserInputRaw;
};

const BUFFERS: Record<string, NetworkBuffer> = {};
let CUR_SELECTION: SACSelect = { server: "", channel: "" };

function messageBoxLinesFromBuffer(buffer: Buffer) {
  return buffer.buffer.map((parsed: IRCMessageParsed) => {
    if (parsed.command.toLowerCase() === "privmsg") {
      return `<${parsed.prefix}> ${parsed.params.slice(1).join(" ")}`;
    }

    return parsed.raw;
  })
}

export default function ConnectBox() {
  const [nick, setNick] = useState("");
  const [server, setServer] = useState("");
  const [port, setPort] = useState("");
  const [channels, setChannels] = useState("");
  const [messageBoxLines, setMessageBoxLines] = useState([]);
  const [serversAndChans, setServersAndChans] = useState<SACServers>({});

  async function connect() {
    console.log('connect!', nick, server, port, channels);
    CUR_SELECTION.server = server;

    BUFFERS[server] = { server, buffers: {
      "": {
        name: "",
        buffer: []
      },
      ...channels.split(" ").reduce((a, chan) => ({
        [chan]: {
          name: chan,
          buffer: []
        },
        ...a
      }), {})
    } };

    const networkBuffers = BUFFERS[server].buffers;

    await listen('nhexchat://irc_message', (event: IRCMessageEvent) => {
        if (event.payload.server !== server) {
          return;
        }

        const parsed: IRCMessageParsed = parse(event.payload.message);
        let currentBuffer: Buffer = networkBuffers[""];
        if (parsed.command.toLowerCase() === "privmsg") {
          if (!networkBuffers[parsed.params[0]]) {
            networkBuffers[parsed.params[0]] = {
              name: parsed.params[0],
              buffer: []
            };
          }
          
          currentBuffer = networkBuffers[parsed.params[0]];
        }

        currentBuffer.buffer.push(parsed);

        if (event.payload.server === CUR_SELECTION.server && currentBuffer.name === CUR_SELECTION.channel) {
          setMessageBoxLines(messageBoxLinesFromBuffer(currentBuffer));
          emit("nhexchat://servers_and_chans/selected", CUR_SELECTION);
        }

        setServersAndChans(Object.fromEntries(Object.entries(BUFFERS).map(([server, netBuffs]) => (
          [server, Object.keys(netBuffs.buffers).filter((c) => c !== "")]
        ))));
    });

    await listen("nhexchat://servers_and_chans/select", (event: SACSelectEvent) => {
      const { server, channel } = event.payload;
      CUR_SELECTION = { server, channel };
      setMessageBoxLines(messageBoxLinesFromBuffer(BUFFERS[server].buffers[channel]));
      emit("nhexchat://servers_and_chans/selected", CUR_SELECTION);
    });

    await listen("nhexchat://user_input/raw", (event: MBUserInputEvent) => {
      if (event.payload.command.toLowerCase() === "privmsg") {
        BUFFERS[CUR_SELECTION.server].buffers[CUR_SELECTION.channel].buffer.push({
          command: event.payload.command,
          params: event.payload.args,
          prefix: nick, ///TODO: this better
          raw: event.payload.raw,
          tags: {}
        });

        emit("nhexchat://servers_and_chans/select", CUR_SELECTION);
      }

      emit("nhexchat://user_input", { ...CUR_SELECTION, ...event.payload });
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
        />:
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
            <span>Names</span>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
