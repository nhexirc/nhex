import ServersAndChans from "./ServersAndChans"
import MessageBox from "./MessageBox"
import ChannelNames from "./ChannelNames"
import { SERV_MSG_NAMES_PANEL_STYLE } from "./style"

const IRC = ({ servers, names, message }) => {
  return (
    <div className={SERV_MSG_NAMES_PANEL_STYLE}>
      <ServersAndChans servers={servers} />
      <MessageBox lines={message} />
      <ChannelNames names={names} />
    </div>
  )
}

export default IRC
