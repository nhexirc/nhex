import { Buffer, IRCMessageEvent, IRCMessageParsed, MessageParserReturn } from './types';
import { nickFromPrefix } from './common';
import IRCNicksSet from './IRCNicksSet';
import { parse } from 'irc-message';

type MessageHandler = (networkBuffers: Record<string, Buffer>, parsed: IRCMessageParsed) => Buffer;
type MessageHandlers = Record<string, MessageHandler>;

function joinOrPartHandler(functorName: string, networkBuffers: Record<string, Buffer>, parsed: IRCMessageParsed) {
    const { channel } = parsed.params[0].match(/^(?<channel>.*)(?:\r\n)?/).groups;
    const nick = nickFromPrefix(parsed.prefix);
    networkBuffers[channel].names[functorName](nick);
    parsed.command = functorName === "add" ? "join" : "part";
    parsed.params[1] = channel;
    return networkBuffers[channel];
}

function topicHandler(networkBuffers: Record<string, Buffer>, parsed: IRCMessageParsed) {
    let chanIdx = 0, topicIdx = 1;
    if (parsed.command !== "TOPIC") {
        chanIdx = 1;
        topicIdx = 2;
    }

    const channel = parsed.params[chanIdx];
    const newTopicComps = parsed.params.slice(topicIdx);

    if (!networkBuffers[channel]) {
        networkBuffers[channel] = new Buffer(channel);
    }

    networkBuffers[channel].topic = newTopicComps.join(" ").replace("\r\n", "");
    return null;
}

const MODES_TO_HATS = {
    "+o": "@",
    "-o": "",
    "+v": "+",
    "-v": ""
};

const MESSAGE_HANDLERS: MessageHandlers = {
    privmsg: (networkBuffers: Record<string, Buffer>, parsed: IRCMessageParsed) => {
        let retBuf;
        if (parsed.prefix && networkBuffers[parsed.params[0]]?.name[0] !== "#" /* should check that this is US */) {
            const pmPartner = nickFromPrefix(parsed.prefix);
            if (!networkBuffers[pmPartner]) {
                networkBuffers[pmPartner] = new Buffer(pmPartner);
            }

            retBuf = networkBuffers[pmPartner];
        }
        else {
            const [, message] = parsed.params;
            const me = message.match(/\u0001ACTION (?<me>.*)\u0001/)?.groups.me;
            // overwrite parsed
            if (me !== undefined) {
                parsed.command = "action";
                parsed.params[1] = me;
            }

            if (!networkBuffers[parsed.params[0]]) {
                networkBuffers[parsed.params[0]] = new Buffer(parsed.params[0]);
            }

            retBuf = networkBuffers[parsed.params[0]];
        }

        return retBuf;
    },
    join: joinOrPartHandler.bind(null, 'add'),
    part: joinOrPartHandler.bind(null, 'delete'),

    quit: (networkBuffers: Record<string, Buffer>, parsed: IRCMessageParsed) => {
        const nick = nickFromPrefix(parsed.prefix);

        Object.entries(networkBuffers).forEach(([channel, buffer]) => {
            if (channel.length > 0) {
                // if the user was in the channel, add a "part" message for them to it
                if (buffer.names.delete(nick)) {
                    networkBuffers[channel].buffer.push({
                        ...parsed,
                        params: [...parsed.params, channel],
                        command: "part"
                    });
                }
            }
        });

        return null;
    },

    nick: (networkBuffers: Record<string, Buffer>, parsed: IRCMessageParsed) => {
        const oldNick = nickFromPrefix(parsed.prefix);
        const newNick = parsed.params[0].replace('\r\n', '');

        Object.entries(networkBuffers).forEach(([channel, buffer]) => {
            if (buffer.names.has(oldNick)) {
                const currentHat = buffer.names._getCurrentHat(oldNick);
                buffer.names.delete(oldNick);
                buffer.names.add(`${currentHat}${newNick}`);
            }
        });

        return null;
    },

    mode: (networkBuffers: Record<string, Buffer>, parsed: IRCMessageParsed) => {
        const [channel, newMode, nick] = parsed.params;
        networkBuffers[channel].names.add(`${MODES_TO_HATS[newMode]}${nick.replace("\r\n", "")}`);
        return null;
    },

    topic: topicHandler,
};

const NUMERIC_HANDLERS: MessageHandlers = {
    353 /*RPL_NAMREPLY*/: (networkBuffers: Record<string, Buffer>, parsed: IRCMessageParsed) => {
        const chanName = parsed.params[2];
        if (!networkBuffers[chanName]) {
            networkBuffers[chanName] = new Buffer(chanName);
        }

        const buf = networkBuffers[chanName];
        buf.names = new IRCNicksSet([
            ...buf.names,
            ...parsed.params[3].split(" ").map((s) => s.replace('\r\n', ''))
        ]);
        return null;
    },

    332 /* RPL_TOPIC */: topicHandler
};

export default function (
    currentServer: string,
    networkBuffers: Record<string, Buffer>,
    event: IRCMessageEvent,
): MessageParserReturn {
    const parsed: IRCMessageParsed = parse(event.payload.message);
    parsed.timestamp = event.payload.timestamp;

    let currentBuffer: Buffer = networkBuffers[""];

    if (MESSAGE_HANDLERS[parsed.command.toLowerCase()]) {
        currentBuffer = MESSAGE_HANDLERS[parsed.command.toLowerCase()](networkBuffers, parsed);
    }
    else {
        const numeric = Number.parseInt(parsed.command);
        if (!Number.isNaN(numeric) && NUMERIC_HANDLERS[parsed.command]) {
            currentBuffer = NUMERIC_HANDLERS[parsed.command](networkBuffers, parsed);
        }
        else {
            console.log('[UNHANDLED]', parsed.command, parsed);
        }
    }

    // the prefix identifies the actual hostname in the network whereas our "currentServer"
    // is the DNS name we connect to (may be RR DNS for example). this current strategy will break
    // with #33 implemented if users connect to the same TLD twice (incl if subdomains or ports different)
    const ourTLDComps = currentServer.split(".");
    let ourTLD = ourTLDComps.length > 2 ? ourTLDComps.slice(-2).join(".") : currentServer;
    if (parsed.prefix?.endsWith(ourTLD)) {
        parsed.fromServer = true;
    }

    if (currentBuffer) {
        currentBuffer.buffer.push(parsed);
    }

    return { parsed, currentBuffer };
}
