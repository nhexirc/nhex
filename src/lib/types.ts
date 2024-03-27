import IRCNicksSet from './IRCNicksSet';

export interface IRCMessagePayload {
    message: string;
    server: string;
};

export interface IRCMessageEvent {
    payload: IRCMessagePayload;
};

export interface IRCMessageParsed {
    command: string;
    params: string[];
    prefix: string;
    raw: string;
    tags: Record<string, any>;
};

export class Buffer {
    name: string;
    buffer: IRCMessageParsed[];
    names: IRCNicksSet;
};

export interface NetworkBuffer {
    server: string;
    buffers: Record<string, Buffer>;
};

export interface MBUserInputRaw {
    raw: string;
    command: string;
    args: string[];
    argsStr: string;
};

export interface MBUserInputEvent {
    payload: MBUserInputRaw;
};

export interface MessageBoxLine {
    message: IRCMessageParsed;
    isUs: boolean;
}

export type MessageBoxLines = MessageBoxLine[];

export interface MessageParserReturn {
    currentBuffer: Buffer;
    parsed: IRCMessageParsed;
};