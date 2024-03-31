import { createDir, exists, readTextFile, writeTextFile, BaseDirectory } from '@tauri-apps/api/fs';
import { appConfigDir } from '@tauri-apps/api/path';
import { parse, stringify, TomlPrimitive } from 'smol-toml';
import defaultSettings from "./user-settings.default.json" assert { "type": "json" };

// borrowed from https://github.com/rcompat/rcompat/blob/master/object/extend.js
const extend = (base = {}, extension = {}) => {
  if (typeof base !== "object") {
    return base;
  }
  return Object.keys(extension).reduce((result, property) => {
    const value = extension[property];
    return {
      ...result,
      [property]: value?.constructor === Object
        ? extend(base[property], value)
        : value,
    };
  }, base);
};

const FILE_NAME = 'nhex.toml';

async function ensureOurAppConfigPath() {
    const cfgDir = await appConfigDir();
    if (!await exists(cfgDir)) {
        await createDir(cfgDir);
    }
}

export async function load(): Promise<Record<string, TomlPrimitive>> {
    let settings = {};
    try {
        await ensureOurAppConfigPath();
        const raw = await readTextFile(FILE_NAME, { dir: BaseDirectory.AppConfig });
        settings = parse(raw);
    } catch (_) {
        return defaultSettings;
    }
    return extend(defaultSettings, settings);
}

export async function save(obj: Record<string, any>) {
    await ensureOurAppConfigPath();
    return writeTextFile(FILE_NAME, stringify(obj), { dir: BaseDirectory.AppConfig });
}

export default { load, save };
