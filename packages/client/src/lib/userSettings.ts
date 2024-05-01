import { readTextFile, writeTextFile, BaseDirectory } from '@tauri-apps/api/fs';
import { parse, stringify } from 'smol-toml';
import defaultSettings from "./user-settings.default.json" assert { "type": "json" };
import { UserSettingsIface } from './types';
import { ensureOurAppConfigPath } from './common';

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

export async function load(): Promise<UserSettingsIface> {
  let settings = {};
  try {
    await ensureOurAppConfigPath();
    const raw = await readTextFile(FILE_NAME, { dir: BaseDirectory.AppConfig });
    settings = parse(raw);
  } catch (e) {
    console.error(e);
    return defaultSettings;
  }
  return extend(defaultSettings, settings);
}

export async function save(obj: UserSettingsIface) {
  await ensureOurAppConfigPath();
  await writeTextFile(FILE_NAME, stringify(obj), { dir: BaseDirectory.AppConfig });
  return obj;
}

export default { load, save };
