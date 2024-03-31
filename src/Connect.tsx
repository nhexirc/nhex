import { SERVER_FORM_BLOCK_STYLE, SERVER_FORM_STYLE, SERVER_INPUT_STYLE, TLS_ACTIVE_STYLE, TLS_BUTTON_STYLE, TLS_INACTIVE_STYLE } from "./style";

const Connect = ({
  nick,
  setNick,
  server,
  setServer,
  port,
  setPort,
  channels,
  setChannels,
  handleTLS,
  tls,
  connect }) => {
  //TLS is a div and not a button due to it stealing enter from connect button. It has to do with form rules. As a side-effect and a bonus, the tls handler does not need preventDefault. Just pretend it's a button ok!?!
  return (
    <>
      <p className="text-8xl italic text-center">nhex</p>
      <p className="text-center text-sm">IRC Client</p>
      <form
        className={SERVER_FORM_STYLE}
        onSubmit={connect}
      >
        <div className={SERVER_FORM_BLOCK_STYLE}>
          <input
            value={server}
            className={SERVER_INPUT_STYLE}
            onInput={(e) => setServer(e.currentTarget.value)}
            placeholder="Server"
            autoFocus
          />
          <input
            value={port}
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
            value={nick}
            className={SERVER_INPUT_STYLE}
            onInput={(e) => setNick(e.currentTarget.value)}
            placeholder="Nickname"

          />
          <input
            value={channels}
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
