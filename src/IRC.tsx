import ServersAndChans from "./ServersAndChans"
import MessageBox from "./MessageBox"
import ChannelNames from "./ChannelNames"
import { IRC_STYLE, SERV_MSG_NAMES_PANEL_STYLE } from "./style"
import { useState } from "react"

const IRC = ({ servers, names, message, nick, isNight, settings, topic, getCurSelection, getBuffers, STATE }) => {
  const [isServerSelected, setIsServerSelected] = useState(true);
  return (
    <div className={IRC_STYLE}>

      {isServerSelected ?
        <div className={SERV_MSG_NAMES_PANEL_STYLE}>
          <ServersAndChans setIsServerSelected={setIsServerSelected} servers={servers} getCurSelection={getCurSelection} getBuffers={getBuffers} />
          <MessageBox lines={message} settings={settings} STATE={STATE} nick={nick} isNight={isNight} topic={topic} />
        </div>
        :
        <div className={SERV_MSG_NAMES_PANEL_STYLE}>
          <ServersAndChans setIsServerSelected={setIsServerSelected} servers={servers} getCurSelection={getCurSelection} getBuffers={getBuffers} />
          <MessageBox lines={message} settings={settings} STATE={STATE} nick={nick} isNight={isNight} topic={topic} />
          <ChannelNames names={names} />
        </div>
      }

    </div>
  )
}

export default IRC
