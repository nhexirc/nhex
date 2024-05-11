import { invoke } from "@tauri-apps/api/tauri";
import { emit } from '@tauri-apps/api/event';
import {
  Buffer,
  IRCMessageParsed,
  MBUserInputEvent,
} from './types';
import { version } from '../../package.json';

export const OUR_BUFFER_NAME = `nhex v${version}`;

export function initializeUserInputHandlers(context: Record<any, any>): {
  handlers: Record<string, (MBUserInputEvent) => any>,
  implementedHandlers: string[],
} {
  const {
    server,
    realSetIsConnected,
    getCurSelection,
    BUFFERS,
    STATE,
    setMessageBoxLines,
    refreshServersAndChans,
    messageBoxLinesFromBuffer,
    addLinesToSelectedBuffer,
    channelListState,
    processEndOfChannelListing,
  } = context;

  /* Get or Create if Not Exists the given channel/pm buffer */
  const gcneChannel = (bufferName: string): Buffer => {
    let buf = BUFFERS[server].buffers[bufferName];
    if (!buf) {
      buf = BUFFERS[server].buffers[bufferName] = new Buffer(bufferName);
    }
    return buf;
  };

  const handlers = {
    privmsg(event: MBUserInputEvent) {
      BUFFERS[server].buffers[getCurSelection().channel].buffer.push(new IRCMessageParsed(
        "PRIVMSG",
        [getCurSelection().channel, ...event.payload.args],
        STATE.nick,
        event.payload.raw,
        true,
      ));

      emit("nhex://servers_and_chans/select", { ...getCurSelection(), server });
      // Use an empty string here, as it will never collide with actual command names.
      return "";
    },

    async msg(event: MBUserInputEvent) {
      const pmPartnerNick = event.payload.args[0];
      const messageParams = event.payload.args.slice(1);

      gcneChannel(pmPartnerNick).buffer.push(new IRCMessageParsed(
        "PRIVMSG",
        [pmPartnerNick, ...messageParams],
        STATE.nick,
        messageParams.join(" "),
      ));

      await emit("nhex://servers_and_chans/select", { server, channel: pmPartnerNick });
      refreshServersAndChans();
      return "msg";
    },

    async join(event: MBUserInputEvent) {
      if (event.payload.args.length === 1) {
        const [channel] = event.payload.args;
        gcneChannel(channel);
        await emit("nhex://servers_and_chans/select", { server, channel });
        refreshServersAndChans();
      }

      return "join";
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

      delete BUFFERS[server].buffers[channel];

      if (channel === getCurSelection().channel) {
        getCurSelection().channel = "";
        setMessageBoxLines(messageBoxLinesFromBuffer(BUFFERS[server].buffers[""]));
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

    async list(event: MBUserInputEvent) {
      if (!BUFFERS[OUR_BUFFER_NAME]) {
        BUFFERS[OUR_BUFFER_NAME] = {
          server: OUR_BUFFER_NAME,
          buffers: {
            "": new Buffer("")
          }
        };
      }

      const ourBuf = BUFFERS[OUR_BUFFER_NAME].buffers[""].buffer;

      ourBuf.push(new IRCMessageParsed(
        "PRIVMSG",
        ['', '`/list', ...event.payload.args, '`'],
        STATE.nick,
        event.payload.raw,
      ));

      channelListState.lastRefreshUnix = await invoke("user_db_last_channel_listing_time_for_network", {
        network: server
      });

      const [searchStrCheck] = event.payload.args.slice(-1);
      if (!searchStrCheck || searchStrCheck === "-fetch") {
        return addLinesToSelectedBuffer([
          "No search string was given!",
          "Help: https://nhexirc.com/docs/guides/commands/#list",
        ]);
      }

      if (!channelListState.lastRefreshUnix && !event.payload.args.includes("-fetch")) {
        return addLinesToSelectedBuffer([
          "The channel database has never been populated so we must fetch a large amount of data from the network.",
          "On some servers, this may cause you to be disconnected for flooding.",
          "If you understand this risk and wish to continue, add `-fetch`.",
        ])
      }

      channelListState.search = searchStrCheck;
      channelListState.searchTopic = event.payload.args.includes("-topic");

      // replace all *s to %s without replaceAll (should be just polyfill it?)
      while (channelListState.search && channelListState.search.indexOf("*") !== -1) {
        channelListState.search = channelListState.search.replace("*", "%");
      }

      if (!event.payload.args.includes("-fetch")) {
        await processEndOfChannelListing(false, channelListState.searchTopic);
        return null;
      }

      // setup the "status line" to be appended to during the listing
      BUFFERS[OUR_BUFFER_NAME].buffers[""].buffer.push(new IRCMessageParsed(
        "privmsg",
        [""],
        "nhex!nhex@nhex",
        "",
        false,
      ));

      return "list";
    },
  };

  // TODO: make this user-configurable?
  const aliases = {
    j: "join",
    l: "list",
    p: "part",
    q: "quit",
    w: "whois",
  };

  Object.entries(aliases).forEach(([alias, funcName]) => {
    handlers[alias] = handlers[funcName].bind(handlers);
  });

  return {
    handlers,
    implementedHandlers: Object.keys(handlers),
  };
}
