import { invoke } from "@tauri-apps/api/tauri";
import { explodePrefix } from './common';
import { IRCMessageParsed } from './types';

export default class {
  async init() {
    return invoke("user_db_init", {});
  }

  async log_message(network: string, message: IRCMessageParsed) {
    const { nickname, ident, hostname } = explodePrefix(message.prefix);
    const args = {
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