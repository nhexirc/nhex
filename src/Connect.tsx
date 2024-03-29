import { SERVER_FORM_BLOCK_STYLE, SERVER_FORM_STYLE, SERVER_INPUT_STYLE } from "./style";

const Connect = ({ setNick, setServer, setPort, port, setTLS, tls, setChannels, connectFunction }) => {
  return (
    <form
      className={SERVER_FORM_STYLE}
      onSubmit={(e) => {
        e.preventDefault();
        connectFunction();
      }}
    >
      <div className={SERVER_FORM_BLOCK_STYLE}>
        <input
          id="nick-input"
          className={SERVER_INPUT_STYLE}
          onInput={(e) => setNick(e.currentTarget.value)}
          placeholder="Nickname"
          autoFocus
        />
        <input
          id="server-input"
          className={SERVER_INPUT_STYLE}
          onInput={(e) => setServer(e.currentTarget.value)}
          placeholder="Server"
        />
        <input
          id="port-input"
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
        <input
          id="tls-input"
          type="checkbox"
          checked={tls}
          onChange={(e) => setTLS(!tls)}
        />
        <label htmlFor="tls-input">TLS</label>
      </div>
      <div className={SERVER_FORM_BLOCK_STYLE}>
        <input
          id="channels"
          className={SERVER_INPUT_STYLE}
          onInput={(e) => setChannels(e.currentTarget.value)}
          placeholder="#nhex ##programming"
        />
        <button
          type="submit"
          onClick={(e) => (e.currentTarget.textContent = 'Disconnect')} //needs wiring
          className="border px-2 py-1"
        >Connect</button>
      </div>
    </form>
  )
}

export default Connect
