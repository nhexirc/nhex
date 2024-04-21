import ServersAndChans from "./ServersAndChans"
import ChannelNames from "./ChannelNames"
import { IRC_STYLE, SERV_MSG_NAMES_PANEL_STYLE } from "./style"
import { useState } from "react"
import TopicMessagesInput from "./TopicMessagesInput"

const IRC = ({ servers, names, message, nick, isNight, dayNightToggle, topic, getCurSelection, getBuffers, STATE, menuTriggers, menuState }) => {
  const [isServerSelected, setIsServerSelected] = useState(true);
  return (
    <div className={IRC_STYLE}>

      {isServerSelected ?
        <div className={SERV_MSG_NAMES_PANEL_STYLE}>
          <ServersAndChans setIsServerSelected={setIsServerSelected} servers={servers} getCurSelection={getCurSelection} getBuffers={getBuffers} />
          <TopicMessagesInput lines={message} STATE={STATE} nick={nick} isNight={isNight} topic={topic} dayNightToggle={dayNightToggle} menuTriggers={menuTriggers} menuState={menuState} />
        </div>
        :
        <div className={SERV_MSG_NAMES_PANEL_STYLE}>
          <ServersAndChans setIsServerSelected={setIsServerSelected} servers={servers} getCurSelection={getCurSelection} getBuffers={getBuffers} />
          <TopicMessagesInput lines={message} STATE={STATE} nick={nick} isNight={isNight} topic={topic} dayNightToggle={dayNightToggle} menuTriggers={menuTriggers} menuState={menuState} />
          <ChannelNames names={names} />
        </div>
      }

    </div>
  )
}

export default IRC
