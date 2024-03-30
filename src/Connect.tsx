import { SERVER_FORM_BLOCK_STYLE, SERVER_FORM_STYLE, SERVER_INPUT_STYLE, TLS_ACTIVE_STYLE, TLS_BUTTON_STYLE, TLS_INACTIVE_STYLE } from "./style";

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
let ext = ".json";
try {
   preloadedConfig = (await import("./preload" + ext)).default;
} catch (_) {
   // do nothing both on import and JSON.parse errors
   preloadedConfig = {};
}

const Connect = ({ setNick, setServer, setPort, port, handleTLS, tls, setChannels, connect }) => {
    // preload; the actual values are handed into the fields below
    if (preloadedConfig !== undefined) {
        preloadedConfig.server !== undefined && setServer(preloadedConfig.server);
        preloadedConfig.port !== undefined && setPort(preloadedConfig.port);
        preloadedConfig.nick !== undefined && setNick(preloadedConfig.nick);
        preloadedConfig.channels !== undefined && setChannels(preloadedConfig.channels);
    }
  //TLS is a div and not a button due to it stealing enter from connect button. It has to do with form rules. As a side-effect and a bonus, the tls handler does not need preventDefault. Just pretend it's a button ok!?!
  return (
    <>
      <p className="text-8xl italic text-center">NHEX</p>
      <p className="text-center text-sm">IRC Client</p>
      <form
        className={SERVER_FORM_STYLE}
        onSubmit={connect}
      >
        <div className={SERVER_FORM_BLOCK_STYLE}>
          <input
            value={preloadedConfig.server}
            className={SERVER_INPUT_STYLE}
            onInput={(e) => setServer(e.currentTarget.value)}
            placeholder="Server"
            autoFocus
          />
          <input
            value={preloadedConfig.port}
            className={SERVER_INPUT_STYLE}
            onInput={(e) => {
              const intVal = Number.parseInt(e.currentTarget.value);
              if (!Number.isNaN(intVal) && Number.isInteger(intVal) && intVal < 65536) {
                setPort(e.currentTarget.value);
              }
              else {
                e.currentTarget.value = port;
              }
            }}
            placeholder="Port"
          />
        </div>
        <div className={SERVER_FORM_BLOCK_STYLE}>
          <input
            value={preloadedConfig.nick}
            className={SERVER_INPUT_STYLE}
            onInput={(e) => setNick(e.currentTarget.value)}
            placeholder="Nickname"

          />
          <input
            value={preloadedConfig.channels}
            id="channels"
            className={SERVER_INPUT_STYLE}
            onInput={(e) => setChannels(e.currentTarget.value)}
            placeholder="#nhex ##programming"
          />
        </div>
        <div className="flex gap-2 justify-center flex-col ">
          <div className={`${TLS_BUTTON_STYLE} ${tls ? TLS_ACTIVE_STYLE : TLS_INACTIVE_STYLE}`} onClick={handleTLS}>TLS</div>
          <button
            type="submit"
            onClick={(e) => (e.currentTarget.textContent = 'Disconnect')} //needs wiring
            className="border px-2 py-1"
          >Connect</button>
        </div>
      </form>
    </>
  )
}

export default Connect
