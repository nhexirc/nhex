import ServersAndChans from "./ServersAndChans"
import MessageBox from "./MessageBox"
import ChannelNames from "./ChannelNames"
import { IRC_STYLE, SERV_MSG_NAMES_PANEL_STYLE } from "./style"
import { useState } from "react"
import UserInput from "./UserInput"
import Topic from "./Topic";

const IRC = ({ servers, names, message, settings, topic, getCurSelection, getBuffers, STATE }) => {
  const [isServerSelected, setIsServerSelected] = useState(true);
  return (
    <div className={IRC_STYLE}>
      <Topic topic={topic} />

      {isServerSelected ?
        <div className={SERV_MSG_NAMES_PANEL_STYLE}>
          <ServersAndChans setIsServerSelected={setIsServerSelected} servers={servers} getCurSelection={getCurSelection} getBuffers={getBuffers} />
          <MessageBox lines={message} settings={settings} STATE={STATE} />
        </div>
        :
        <div className={SERV_MSG_NAMES_PANEL_STYLE}>
          <ServersAndChans setIsServerSelected={setIsServerSelected} servers={servers} getCurSelection={getCurSelection} getBuffers={getBuffers} />
          <MessageBox lines={message} settings={settings} STATE={STATE} />
          <ChannelNames names={names} />
        </div>
      }

      <UserInput />
    </div>
  )
}

export default IRC
