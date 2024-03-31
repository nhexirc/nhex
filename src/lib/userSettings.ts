import { createDir, exists, readTextFile, writeTextFile, BaseDirectory } from '@tauri-apps/api/fs';
import { appConfigDir } from '@tauri-apps/api/path';
import { parse, stringify, TomlPrimitive } from 'smol-toml';

const FILE_NAME = 'nhex.toml';

async function ensureOurAppConfigPath() {
    const cfgDir = await appConfigDir();
    if (!await exists(cfgDir)) {
        await createDir(cfgDir);
    }
}

export async function load(): Promise<Record<string, TomlPrimitive>> {
    await ensureOurAppConfigPath();
    const raw = await readTextFile(FILE_NAME, { dir: BaseDirectory.AppConfig });
    return parse(raw);
}

export async function save(obj: Record<string, any>) {
    await ensureOurAppConfigPath();
    return writeTextFile(FILE_NAME, stringify(obj), { dir: BaseDirectory.AppConfig });
}

export default { load, save };
