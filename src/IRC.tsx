import ServersAndChans from "./ServersAndChans"
import MessageBox from "./MessageBox"
import ChannelNames from "./ChannelNames"
import { IRC_CONDITIONAL_STYLE, SERV_MSG_NAMES_PANEL_STYLE } from "./style"
import { useState } from "react"
import UserInput from "./UserInput"

const IRC = ({ servers, names, message, settings }) => {

  const [isServerSelected, setIsServerSelected] = useState(true);

  return (
    <>
      {isServerSelected ?
        <div className={IRC_CONDITIONAL_STYLE}>
          <div className={SERV_MSG_NAMES_PANEL_STYLE}>
            <ServersAndChans setIsServerSelected={setIsServerSelected} servers={servers} />
            <MessageBox lines={message} settings={settings} />
          </div>
          <UserInput />
        </div>
        :
        <div className={IRC_CONDITIONAL_STYLE}>
          <div className={SERV_MSG_NAMES_PANEL_STYLE}>
            <ServersAndChans setIsServerSelected={setIsServerSelected} servers={servers} />
            <MessageBox lines={message} settings={settings} />
            <ChannelNames names={names} />
          </div>
          <UserInput />
        </div>
      }
    </>
  )
}

export default IRC
