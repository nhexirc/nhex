/*
 * NB: for testing, you can place a preload.json file in this file's directory
 * to preload values into fields in the connection screen. For example:
 *
 * {
 *   "server": "irc.libera.chat",
 *   "port": 6697,
 *   "nick": "nhex-tester",
 *   "channels": "#nhex"
 *  }
 *
 *  You don't have to specify all values.
 */
let preloadedConfig: {
    server?: string,
    port?: number,
    nick?: string,
    channels?: string,
};
// to avoid vite complaining about a missing preload.json file
try {
   /* @vite-ignore */
   preloadedConfig = (await import("./preload.json")).default;
} catch (_) {
   // do nothing both on import and JSON.parse errors
   preloadedConfig = {};
}


export default preloadedConfig;
