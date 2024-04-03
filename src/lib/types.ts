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
    fromServer?: boolean;
};

export class Buffer {
    name: string;
    topic: string = "";
    buffer: IRCMessageParsed[] = [];
    names: IRCNicksSet = new IRCNicksSet();

    constructor(name: string) {
        this.name = name;
    }
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

export class UserInput {
    server: string = "";
    channel: string = "";
    raw: string = "";
    command: string = "";
    args: string[] = [];
    argsStr: string = "";

    constructor(command: string) {
        this.command = command;
    }
};

export type SACServers = Record<string, string[]>;
export interface SACProps {
  servers: SACServers;
};

export interface SACSelect {
  server: string;
  channel: string;
};

export interface SACSelectEvent {
  payload: SACSelect
};