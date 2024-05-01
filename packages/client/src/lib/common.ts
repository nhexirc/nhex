import { MBUserInputRaw, Buffer, MessageBoxLines, IRCMessageParsed } from './types';
import { appConfigDir } from '@tauri-apps/api/path';
import { createDir, exists } from '@tauri-apps/api/fs';

export function messageBoxLinesFromBuffer(buffer: Buffer): MessageBoxLines {
  return buffer.buffer.map((parsed: IRCMessageParsed) => ({ message: parsed }));
}

export async function ensureOurAppConfigPath() {
  const cfgDir = await appConfigDir();
  if (!await exists(cfgDir)) {
    await createDir(cfgDir);
  }
  return cfgDir;
}

export function nickFromPrefix(prefix: string | undefined | null): string {
  prefix = prefix || "SERVER";
  const bangdex = prefix.indexOf("!");

  if (bangdex > 0) {
    prefix = prefix.slice(0, bangdex);
  }

  return prefix;
}

export function explodePrefix(prefix: string | undefined | null): Record<string, string> {
  prefix = prefix || "SERVER";
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