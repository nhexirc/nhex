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
import IRC from "./IRC";
import Connect from "./Connect";
import preload from "./preload";
import UserSettings from './lib/userSettings';
import connect from './lib/connect';
import disconnect from './lib/disconnect';
import { parseMBUserInputRaw } from './lib/common';
import Menu from "./Menu";
import Footer from "./Footer";
import Settings from "./Settings";
import DNDUploaders from './lib/dndUploaders';
import { extname } from '@tauri-apps/api/path';

const BUFFERS: Record<string, NetworkBuffer> = {};
const getBuffers = () => ({ ...BUFFERS });
let CUR_SELECTION: SACSelect = { server: "", channel: "" };
const getCurSelection = () => ({ ...CUR_SELECTION });
const STATE = {
  connected: false,
  pastMOTD: false,
  nick: null,
};
const SETTINGS = {
  userSettings: {}
};
const getUserSettings: () => UserSettingsIface = () => ({ ...SETTINGS.userSettings });

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

listen('tauri://file-drop', async (event) => {
  const { channel } = CUR_SELECTION;

  // don't allow DnD in the server query window (not much of a point)
  if (channel === "") {
    return;
  }

  const [file] = event.payload as string[];
  const ext = await extname(file);
  const emitObj = { file, host: null };

  UserSettings.load().then(async (settings) => {
    if (settings?.DragAndDrop?.enable) {
      if (settings?.DragAndDrop?.textUploadHost && (settings?.DragAndDrop?.textFileExtensions ?? []).includes(ext)) {
        emitObj.host = settings?.DragAndDrop?.textUploadHost;
      }

      if (settings?.DragAndDrop?.imageUploadHost && (settings?.DragAndDrop?.imageImageExtensions ?? []).includes(ext)) {
        emitObj.host = settings?.DragAndDrop?.imageUploadHost;
      }
    }

    if (emitObj.host && DNDUploaders[emitObj.host]) {
      emit("nhex://file-drop/processing", emitObj);
      emit("nhex://file-drop/confirmed", {
        ...emitObj,
        url: await DNDUploaders[emitObj.host](emitObj.file)
      });
    }
  });
})

const MainView = ({ dayNightToggle, isNight, menuTriggers, menuState, db }) => {
  const [nick, _setNick] = useState("");
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

  const setNick = (nick: string) => {
    _setNick(STATE.nick = nick);
  };

  const realSetIsConnected = (val: any) => {
    STATE.connected = val;
    setIsConnected(val);
  };

  const reloadUserSettings = () => UserSettings.load().then((settings) => {
    SETTINGS.userSettings = settings;
    setUserSettings(settings);
    return settings;
  });

  function refreshServersAndChans() {
    setServersAndChans(Object.fromEntries(Object.entries(BUFFERS).map(([server, netBuffs]) => (
      [server, Object.keys(netBuffs.buffers).filter((c) => c !== "")]
    ))));
  };

  function cleanupDirtyBuffers() {
    Object.entries(BUFFERS).forEach(([, networkBufs]) =>
      Object.entries(networkBufs.buffers).forEach(([, buffer]) => (buffer.cleanup()))
    );

    refreshServersAndChans();
  }

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
        !preloaded.port && Network["port"] && setPort(String(Network["port"]));
        !preloaded.channels && Network["channels"] && setChannels(Network["channels"]);
        preloaded.tls === undefined && Network["tls"] !== undefined && setTLS(Network["tls"]);
      });
    });

    let unlistenAppClose: any;
    appWindow.onCloseRequested(async () => {
      await disconnect({
        STATE,
        realSetIsConnected,
        getCurSelection
      });

      appWindow.close();
    }).then((closeFn) => (unlistenAppClose = closeFn));

    menuTriggers.addHandler("settings", reloadUserSettings);
    menuTriggers.addHandler("view", cleanupDirtyBuffers);

    return () => {
      menuTriggers.removeHandler("view", cleanupDirtyBuffers);
      menuTriggers.removeHandler("settings", reloadUserSettings);
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
    setCurSelection: (newVal: any) => (CUR_SELECTION = { ...newVal }),
    BUFFERS,
    STATE,
    setMessageBoxLines,
    setChannelNames,
    setTopic,
    setNick,
    refreshServersAndChans,
    getUserSettings,
  };

  const handleConnect = async (e: any) => {
    e.preventDefault();

    const postConnectCommands = async () => {
      await emit("nhex://user_input/raw", parseMBUserInputRaw(`/join ${channels}`));
    };

    let loggedInCallback: () => any = null;

    if (userSettings.Network?.server === server && userSettings.Network?.expectLoggedInAfterConnectCommands === true) {
      loggedInCallback = postConnectCommands;
    }

    const postMotdCallback = async () => {
      if (userSettings.Network?.server === server && userSettings.Network?.connectCommands) {
        await Promise.all(userSettings.Network.connectCommands
          .map((raw) => emit("nhex://user_input/raw", parseMBUserInputRaw(raw))));
      }

      if (!loggedInCallback) {
        await postConnectCommands();
      }
    };

    await connect(connectContext, db, { postMotdCallback, loggedInCallback });
    // shows the main UI
    setIsConnected(true);
    await emit("nhex://servers_and_chans/select", { server, channel: "" });
  }

  if (menuState.settings) {
    return (<>
      <Menu dayNightToggle={dayNightToggle} isNight={isNight} menuTriggers={menuTriggers} state={menuState} />
      <Settings isNight={isNight}></Settings>
    </>);
  }

  return (
    <>
      {!isConnected ?
        <>
          <Menu dayNightToggle={dayNightToggle} isNight={isNight} menuTriggers={menuTriggers} state={menuState} />
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
            connect={handleConnect}
            isNight={isNight} />
          <Footer isNight={isNight} />
        </>
        :
        <IRC
          servers={serversAndChans}
          message={messageBoxLines}
          names={channelNames}
          nick={nick}
          isNight={isNight}
          dayNightToggle={dayNightToggle}
          topic={topic}
          getCurSelection={getCurSelection}
          getBuffers={getBuffers}
          STATE={STATE}
          menuTriggers={menuTriggers}
          menuState={menuState}
        />
      }
    </>
  );
}

export default MainView
