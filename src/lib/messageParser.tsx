import { Buffer, IRCMessageParsed, MessageParserReturn } from './types';
import { nickFromPrefix } from './common';

type MessageHandler = (networkBuffers: Record<string, Buffer>, parsed: IRCMessageParsed) => Buffer;
type MessageHandlers = Record<string, MessageHandler>;

function joinOrPartHandler(functorName: string, networkBuffers: Record<string, Buffer>, parsed: IRCMessageParsed) {
    const buf = networkBuffers[parsed.params[0].replace('\r\n', '')];
    buf.names[functorName](nickFromPrefix(parsed.prefix));
    return null; // return `buf` here to have joins & parts appear in the channel
}

const MESSAGE_HANDLERS: MessageHandlers = {
    privmsg: (networkBuffers: Record<string, Buffer>, parsed: IRCMessageParsed) => {
        if (!networkBuffers[parsed.params[0]]) {
            networkBuffers[parsed.params[0]] = {
                name: parsed.params[0],
                buffer: [],
                names: new Set()
            };
        }

        return networkBuffers[parsed.params[0]];
    },
    join: joinOrPartHandler.bind(null, 'add'),
    part: joinOrPartHandler.bind(null, 'delete'),
};

const NUMERIC_HANDLERS: MessageHandlers = {
    353 /*RPL_NAMREPLY*/: (networkBuffers: Record<string, Buffer>, parsed: IRCMessageParsed) => {
        const chanName = parsed.params[2];
        if (!networkBuffers[chanName]) {
            networkBuffers[chanName] = {
                name: chanName,
                buffer: [],
                names: new Set()
            };
        }

        const buf = networkBuffers[chanName];
        buf.names = new Set([
            ...buf.names,
            ...parsed.params[3].split(" ").map((s) => s.replace('\r\n', ''))
        ]);
        return null;
    }
};

export default function (
    networkBuffers: Record<string, Buffer>,
    parsed: IRCMessageParsed
): MessageParserReturn {
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

    if (currentBuffer) {
        currentBuffer.buffer.push(parsed);
    }

    return { parsed, currentBuffer };
}