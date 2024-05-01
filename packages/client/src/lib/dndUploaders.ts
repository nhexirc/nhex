import { invoke } from "@tauri-apps/api/tauri";

export default {
  'termbin.com': async (filepath: string) => {
    const resultU8s = await invoke("dnduploader_termbin", { filepath });
    return new TextDecoder().decode(new Uint8Array(resultU8s as number[]));
  }
};