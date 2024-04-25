import { invoke } from "@tauri-apps/api/tauri";
import { ensureOurAppConfigPath, explodePrefix } from './common';
import { join } from 'path';
import { IRCMessageParsed } from './types';

const FILE_NAME = "nhex.sqlite3";

export default class {
  #path: string;

  async init() {
    this.#path = join(await ensureOurAppConfigPath(), FILE_NAME);
    return invoke("user_db_init", { path: this.#path });
  }

  async log_message(network: string, message: IRCMessageParsed) {
    const { nickname, ident, hostname } = explodePrefix(message.prefix);
    const args = {
      path: this.#path,
      log: {
        network,
        target: message.fromServer ? null : message.params[0],
        command: message.command.toUpperCase(),
        nickname,
        ident,
        hostname,
        message: message.params.join(" ").replace(/\r\n$/, ""),
        time_unix_ms: message.timestamp,
        from_server: message?.fromServer || false,
        from_us: message?.fromUs || false,
        highlighted_us: message?.highlightedUs || false,
      }
    };

    return invoke("user_db_log_message", args);
  }
}