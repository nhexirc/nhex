import { useState, useEffect } from "react";
import { emit, listen } from '@tauri-apps/api/event';
import { appWindow } from "@tauri-apps/api/window";
import {
  NetworkBuffer,
  MessageBoxLines,
  SACServers,
  SACSelect,
  UserSettingsIface,
} from './lib/types';
import { CONNECT_STYLE, IRC_STYLE } from "./style";
import IRC from "./IRC";
import Connect from "./Connect";
import preload from "./preload";
import UserSettings from './lib/userSettings';
import connect from './lib/connect';
import disconnect from './lib/disconnect';
import { parseMBUserInputRaw } from './lib/common';

const BUFFERS: Record<string, NetworkBuffer> = {};
let CUR_SELECTION: SACSelect = { server: "", channel: "" };
const getCurSelection = () => ({ ...CUR_SELECTION });
const STATE = {
  connected: false
};

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
  const [userSettings, setUserSettings] = useState<UserSettingsIface>({});
  const [topic, setTopic] = useState("");

  const realSetIsConnected = (val) => {
    STATE.connected = val;
    setIsConnected(val);
  };

  const reloadUserSettings = () => UserSettings.load().then((settings) => {
    setUserSettings(settings);
    return settings;
  });

  useEffect(() => {
    preload().then((preloaded: {
      nick?: string,
      server?: string,
      port?: number,
      channels?: string,
      tls?: boolean
    }) => {
      preloaded.nick && setNick(preloaded.nick);
      preloaded.server && setServer(preloaded.server);
      preloaded.port && setPort(`${preloaded.port}`);
      preloaded.channels && setChannels(preloaded.channels);
      preloaded.tls !== undefined && setTLS(preloaded.tls);

      reloadUserSettings().then(({ Network }) => {
        // preloads override user settings
        !preloaded.nick && Network["nick"] && setNick(Network["nick"]);
        !preloaded.server && Network["server"] && setServer(Network["server"]);
        !preloaded.port && Network["port"] && setPort(Network["port"]);
        !preloaded.channels && Network["channels"] && setChannels(Network["channels"]);
        preloaded.tls === undefined && Network["tls"] !== undefined && setTLS(Network["tls"]);
      });
    });

    let unlistenAppClose;
    appWindow.onCloseRequested(async (event) => {
      await disconnect({
        STATE,
        realSetIsConnected,
        getCurSelection
      });

      appWindow.close();
    }).then((closeFn) => (unlistenAppClose = closeFn));

    let unlistenSettingsClick;
    // we could setup a file watcher for the user settings file and not need an explicit
    // "refresh" button, but for now this works in a pinch
    listen("nhex://menu/settings", reloadUserSettings)
      .then((ulFunc) => (unlistenSettingsClick = ulFunc));

    return () => {
      unlistenSettingsClick?.();
      unlistenAppClose?.();
    };
  }, []);

  const connectContext = {
    nick,
    server,
    port,
    channels,
    tls,
    isConnected,
    realSetIsConnected,
    getCurSelection,
    setCurSelection: (newVal) => (CUR_SELECTION = { ...newVal }),
    BUFFERS,
    STATE,
    setMessageBoxLines,
    setChannelNames,
    setTopic,
    refreshServersAndChans: () => {
      setServersAndChans(Object.fromEntries(Object.entries(BUFFERS).map(([server, netBuffs]) => (
        [server, Object.keys(netBuffs.buffers).filter((c) => c !== "")]
      ))));
    }
  };

  // will need a disconnect function above with the bool state variable to bring us back to login after disconnecting
  return (
    <>
      {!isConnected ?
        <div className={CONNECT_STYLE} >
          <Connect
            nick={nick}
            setNick={setNick}
            server={server}
            setServer={setServer}
            port={port}
            setPort={setPort}
            channels={channels}
            setChannels={setChannels}
            handleTLS={() => setTLS(!tls)}
            tls={tls}
            connect={async (e: any) => {
              e.preventDefault();

              const postConnectCommands = async () => {
                await emit("nhex://user_input/raw", parseMBUserInputRaw(`/join ${channels}`));
              };

              let loggedInCallback;
              if (userSettings.Network?.expectLoggedInAfterConnectCommands === true) {
                loggedInCallback = postConnectCommands;
              }

              const postMotdCallback = async () => {
                await emit("nhex://servers_and_chans/select", { server, channel: "" });
  
                if (userSettings.Network?.connectCommands) {
                  await Promise.all(userSettings.Network.connectCommands
                    .map((raw) => emit("nhex://user_input/raw", parseMBUserInputRaw(raw))));
                }

                if (!loggedInCallback) {
                  await postConnectCommands();
                }
              };

              await connect(connectContext, { postMotdCallback, loggedInCallback });

              // shows the main UI
              setIsConnected(true);
            }} />
        </div>
        :
        <div className={IRC_STYLE}>
          <IRC
            servers={serversAndChans}
            message={messageBoxLines}
            names={channelNames}
            settings={{
              userSettings,
              setUserSettings,
            }}
            topic={topic} />
        </div>
      }
    </>
  );
}

export default MainView
