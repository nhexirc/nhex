import IRCNicksSet from './IRCNicksSet';

export interface IRCMessagePayload {
    message: string;
    server: string;
    timestamp: number;
};

export interface IRCMessageEvent {
    payload: IRCMessagePayload;
};

export class IRCMessageParsed {
    command: string;
    params: string[];
    prefix: string;
    raw: string;
    tags: Record<string, any> = {};
    timestamp: number = Number(new Date());
    fromServer: boolean = false;

    constructor(command: string, params: string[], prefix: string, raw: string) {
        this.command = command;
        this.params = params;
        this.prefix = prefix;
        this.raw = raw;
    }
};

export class Buffer {
    name: string;
    topic: string = "";
    buffer: IRCMessageParsed[] = [];
    names: IRCNicksSet = new IRCNicksSet();
    dirty: boolean = false;

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
    timestamp: number;
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

export interface MessageBoxUserSettings {
    show?: string[]; // valid values are: [ "action", "privmsg", "part", "join" ]
    dimJoinsAndParts?: boolean;
    showTimestamps?: boolean;
    fontSize?: string; // valid values are just the size specifiers from https://tailwindcss.com/docs/font-size (without hyphen!), e.g. "sm"
};

export interface NetworkUserSettings {
    server?: string;
    port?: number;
    nick?: string;
    channels?: string; // space-delimited (like /join)
    tls?: boolean;
    connectCommands?: string[];
    // if set to 'true', connectCommands is expected to contain a command that will eventually
    // produce the RPL_LOGGEDIN (900) protocol message: without this message receipt, no channels
    // will be joined!
    expectLoggedInAfterConnectCommands?: boolean;
    routeNoticesToServerBuffer?: boolean;
};

export interface UserSettingsIface {
    MessageBox?: MessageBoxUserSettings;
    Network?: NetworkUserSettings;
}