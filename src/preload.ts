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
    // to avoid TS borking the build
    const name = "./preload";
    const ext = ".json";
    try {
       return (await import(/* @vite-ignore */name + ext)).default;
    } catch (_) {
       // noop on error
       return {};
    }
};
