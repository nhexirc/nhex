/*
 * NB: for testing, you can place a preload.json file in this file's directory
 * to preload values into fields in the connection screen. For example:
 *
 * {
 *   "server": "irc.libera.chat",
 *   "port": 6697,
 *   "nick": "nhex-tester",
 *   "channels": "#nhex",
 *   "tls": true
 *  }
 *
 *  You don't have to specify all values.
 */
export default async () => {
    // to avoid vite complaining about a missing preload.json file
    const name = "./preload";
    const ext = ".json";
    try {
       /* @vite-ignore */
       return (await import(name + ext)).default;
    } catch (_) {
       // do nothing both on import and JSON.parse errors
       return {};
    }
};
