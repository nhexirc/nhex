import { Buffer, IRCMessageParsed, MessageParserReturn } from './types';

type MessageHandler = (networkBuffers: Record<string, Buffer>, parsed: IRCMessageParsed) => Buffer;
type MessageHandlers = Record<string, MessageHandler>;

const MESSAGE_HANDLERS: MessageHandlers = {
    privmsg: (networkBuffers: Record<string, Buffer>, parsed: IRCMessageParsed) => {
        if (!networkBuffers[parsed.params[0]]) {
            networkBuffers[parsed.params[0]] = {
                name: parsed.params[0],
                buffer: [],
                names: []
            };
        }

        return networkBuffers[parsed.params[0]];
    }
};

const NUMERIC_HANDLERS: MessageHandlers = {
    353 /*RPL_NAMREPLY*/: (networkBuffers: Record<string, Buffer>, parsed: IRCMessageParsed) => {
        const chanName = parsed.params[2];
        if (!networkBuffers[chanName]) {
            networkBuffers[chanName] = {
                name: chanName,
                buffer: [],
                names: []
            };
        }

        const buf = networkBuffers[chanName];
        buf.names = [...buf.names, ...parsed.params[3].split(" ").map((s) => s.replace('\r\n', ''))];
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
    }

    if (currentBuffer) {
        currentBuffer.buffer.push(parsed);
    }

    return { parsed, currentBuffer };
}