import { MBUserInputRaw } from './types';

export function nickFromPrefix(prefix: string): string {
    const bangdex = prefix.indexOf("!");

    if (bangdex > 0) {
        prefix = prefix.slice(0, bangdex);
    }

    return prefix;
}

export function parseMBUserInputRaw(raw: string): MBUserInputRaw {
    raw = raw.trim();
    const uiSplit = raw.split(" ");
    const command = raw.match(/^\s*\/(\w+)/)?.[1] ?? "";

    const args = uiSplit.slice((command === "") ? 0 : 1);
    return {
      raw,
      command,
      args,
      argsStr: args.join(" "),
    };
}