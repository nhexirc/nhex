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
    fromUs: boolean = false;
    highlightedUs: boolean = false;
    historical: boolean = false;

    constructor(command: string, params: string[], prefix: string, raw: string, fromUs: boolean = false) {
        this.command = command;
        this.params = params;
        this.prefix = prefix;
        this.raw = raw;
        this.fromUs = fromUs;
    }
};

export class BufferMesses {
    normal: number = 0;
    highlight: number = 0;
};

export class Buffer {
    name: string;
    topic: string = "";
    buffer: IRCMessageParsed[] = [];
    names: IRCNicksSet = new IRCNicksSet();
    dirty: BufferMesses = new BufferMesses();
    modesHistory: string[][] = [];

    constructor(name: string) {
        this.name = name;
    }

    isDirty(): boolean {
        return Object.values(this.dirty).some((dv) => dv > 0);
    }

    cleanup() {
        this.dirty = new BufferMesses();
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

// this interface is currently just a wrapper around IRCMessageParsed,
// but is kept separate to support (expected) future differentiation
export interface MessageBoxLine {
    message: IRCMessageParsed;
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

export interface AppLoggingSettings {
    enable?: boolean;
};

export interface DragAndDropSettings {
    enable?: boolean;
    textFileExtensions?: string[];
    textUploadHost?: string;
    imageImageExtensions?: string[];
    imageUploadHost?: string;
};

export const MessageBoxValidFontSizes = ["sm", "base", "lg", "xl"];

export interface MessageBoxUserSettings {
    show?: string[]; // valid values are: [ "action", "privmsg", "part", "join" ]
    dimJoinsAndParts?: boolean;
    showTimestamps?: boolean;
    // valid values are just the size specifiers from https://tailwindcss.com/docs/font-size (without hyphen!), e.g. "sm"
    fontSize?: string;
    scrollbackLimitLines?: number;
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
    DragAndDrop?: DragAndDropSettings;
    Logging?: AppLoggingSettings;
    MessageBox?: MessageBoxUserSettings;
    Network?: NetworkUserSettings;
}