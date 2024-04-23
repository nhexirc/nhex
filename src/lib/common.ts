import { MBUserInputRaw } from './types';
import { appConfigDir } from '@tauri-apps/api/path';
import { createDir, exists } from '@tauri-apps/api/fs';

export async function ensureOurAppConfigPath() {
    const cfgDir = await appConfigDir();
    if (!await exists(cfgDir)) {
        await createDir(cfgDir);
    }
    return cfgDir;
}

export function nickFromPrefix(prefix: string): string {
    const bangdex = prefix.indexOf("!");

    if (bangdex > 0) {
        prefix = prefix.slice(0, bangdex);
    }

    return prefix;
}

export function explodePrefix(prefix: string): Record<string, string> {
    const bangdex = prefix.indexOf("!");

    if (bangdex > 0) {
        const nickname = nickFromPrefix(prefix);
        const [ident, hostname] = prefix.slice(bangdex + 1).split("@");
        return { prefix, nickname, ident, hostname };
    }

    return {
        prefix,
        nickname: prefix,
        ident: prefix,
        hostname: prefix
    };
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
      timestamp: Number(new Date()),
    };
}