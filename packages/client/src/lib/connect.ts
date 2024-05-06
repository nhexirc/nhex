import { invoke } from "@tauri-apps/api/tauri";
import { emit, listen } from '@tauri-apps/api/event';
import messageParser from './messageParser';
import { NUMERIC_HANDLERS } from './messageParser';
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
import { OUR_BUFFER_NAME, initializeUserInputHandlers } from './userInputHandlers';

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

  const addLineToOurBuffer = (lines: string[], retPassthru: any = null) => {
    const buf = BUFFERS[OUR_BUFFER_NAME].buffers[""];
    buf.dirty.normal += lines.length;
    lines.forEach((line) => buf.buffer.push(new IRCMessageParsed(
      "privmsg",
      ["", line],
      "nhex!nhex@nhex",
      "",
      false,
    )));
    setMessageBoxLines(messageBoxLinesFromBuffer(buf));
    refreshServersAndChans({ server: OUR_BUFFER_NAME, channel: "" });
    return retPassthru;
  };

  const appendToOurLatestLine = (appendStr: string) => {
    const buf: Buffer = BUFFERS[OUR_BUFFER_NAME].buffers[""];
    let targetParams: string[] = buf.buffer.slice(-1)?.[0]?.params;

    appendStr += " ";
    if (!targetParams) {
      buf.buffer.push(new IRCMessageParsed(
        "privmsg",
        ["", appendStr],
        "nhex!nhex@nhex",
        "",
        false,
      ));
    }
    else {
      targetParams.push(appendStr);
    }

    setMessageBoxLines(messageBoxLinesFromBuffer(buf));
    refreshServersAndChans({ server: OUR_BUFFER_NAME, channel: "" });
  };

  const getHistoricalBuffer = async (channel: string) => {
    const settings = getUserSettings();
    const buffer = new Buffer(channel);

    if (!settings?.Logging?.enable) {
      return buffer;
    }

    ((await invoke("user_db_latest_channel_lines", {
      network: server,
      channel,
      numLines: Math.max(32, Number.parseInt(Number((settings?.MessageBox?.scrollbackLimitLines ?? 1024) / 2).toFixed()))
    })) as string[])
      .map((msgJson) => {
        const msg: IRCMessageParsed = JSON.parse(msgJson);
        msg.historical = true;
        return msg;
      })
      .forEach((parsed: IRCMessageParsed) => buffer.buffer.push(parsed));
    // TODO: add a "history line" special message to the buffer, to render the cutoff?

    return buffer;
  };

  BUFFERS[server] = {
    server,
    buffers: {
      "": new Buffer("") // the server query window
    }
  };

  for (const channel of channels.split(" ")) {
    BUFFERS[server].buffers[channel] = await getHistoricalBuffer(channel);
  }

  const networkBuffers = BUFFERS[server].buffers;
  const channelListState = {
    count: 0,
    search: null,
    searchTopic: false,
    lastRefreshUnix: -1,
  };

  const processEndOfChannelListing = async (wasLiveListing: boolean, searchTopic: boolean = false) => {
    setCurSelection({ server: OUR_BUFFER_NAME, channel: "" });

    if (!channelListState.search) {
      return addLineToOurBuffer([
        "No search string was given!",
        "Help: https://docs.nhexirc.com/guides/commands/#list",
      ]);
    }

    if (wasLiveListing) {
      addLineToOurBuffer([`Fetch finished with ${channelListState.count} channels found.`]);
    }

    let lines = (await invoke("user_db_list_channels_with_pattern", {
      network: server,
      channelPattern: channelListState.search,
      searchTopic
    }) as string[])
      .map((json) => JSON.parse(json))
      .map(({ name, topic, userCount }) => ({
        name,
        topic: topic.replace(/^:/, '').replace(/\r\n$/, ''),
        userCount
      }))
      .map(({ name, topic, userCount }) =>
        `**${name}** (${userCount} nicks) ${topic.length ? `"${topic}"` : ''}`);

    if (!lines.length) {
      lines = [`No channel results found for search "\`${channelListState.search}\`"`];
    }
    else {
      lines = [
        `Search for "**${channelListState.search}**" found ${lines.length} results` +
        (channelListState.searchTopic ? ' (topic included)' : '') + ":",
        "",
        ...lines,
        "",
      ];
    }

    const footer = [
      "---",
      '_legend_: **channel name** (number of nicks) "topic (if not empty)"',
    ];

    if (!wasLiveListing) {
      footer.push(`_data last refreshed at ${new Date(channelListState.lastRefreshUnix).toLocaleString()}_`);
    }

    addLineToOurBuffer(lines.concat(footer));
  };

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

    // don't add messages of these types to any buffer, as they're handled elsewhere
    if (Object.keys(NUMERIC_HANDLERS).map(String).includes(parsed.command)) {
      return;
    }

    /* messageParser breaks a string into fields and handles any direct results,
       whereas the following handle state changes that should be contained here
       (to keep messageParser's context small) */
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
    else if (parsed.command === "321") {
      channelListState.count = 0;
      return;
    }
    else if (parsed.command === "322") {
      channelListState.count++;
      if (!(channelListState.count % 100)) {
        let line = `${channelListState.count}...`;
        if (channelListState.count === 100) {
          line = `Count of channels fetched so far: ${line}`;
        }
        appendToOurLatestLine(line);
      }
      return;
    }
    else if (parsed.command === "323") {
      await processEndOfChannelListing(true, channelListState.searchTopic);
      return;
    }

    if (!currentBuffer) {
      currentBuffer = BUFFERS[getCurSelection().server].buffers[""];
    }

    currentBuffer.buffer.push(parsed);

    // don't trim the server or app buffers
    if (currentBuffer.name !== "" && !event.payload.server.startsWith("nhex")) {
      // trim buffers when they exceed the configured scrollbackLimitLines
      if (currentBuffer.buffer.length > userSettings?.MessageBox?.scrollbackLimitLines) {
        const sliceStart = currentBuffer.buffer.length - userSettings?.MessageBox?.scrollbackLimitLines;
        currentBuffer.buffer = currentBuffer.buffer.slice(sliceStart);
      }
    }

    // if the message was for the user's current selection, refresh it
    if (event.payload.server === getCurSelection().server && currentBuffer.name === getCurSelection().channel) {
      setMessageBoxLines(messageBoxLinesFromBuffer(currentBuffer));
      setChannelNames(currentBuffer.names);
      setTopic(currentBuffer.topic);
      emit("nhex://servers_and_chans/selected", getCurSelection());
    }
    // otherwise, update the message-dirty status of the buffer
    else {
      let relevantCmd = (parsed.command === 'quit' ? 'part' : parsed.command).toLowerCase();
      if (userSettings?.MessageBox?.show?.includes(relevantCmd) ?? true) {
        currentBuffer.dirty.normal++;

        if (parsed.highlightedUs) {
          currentBuffer.dirty.highlight++;
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

  let id = 1; // Start at 1 because the Rust side assumes 0 means "unset".
  const { handlers, implementedHandlers } = initializeUserInputHandlers({
    ...context,
    messageBoxLinesFromBuffer,
    addLinesToSelectedBuffer: addLineToOurBuffer,
    channelListState,
    processEndOfChannelListing,
  });

  listen("nhex://user_input/raw", async (event: MBUserInputEvent) => {
    const command = event.payload.command.toLowerCase();
    const nrmCommand = command === "" ? "privmsg" : command;
    if (implementedHandlers.includes(nrmCommand)) {
      // this handles any special logic, could be a noop, and returns the name
      // of the rust event to be called
      const eventName = await handlers[nrmCommand](event);
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
