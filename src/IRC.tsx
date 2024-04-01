import ServersAndChans from "./ServersAndChans"
import MessageBox from "./MessageBox"
import ChannelNames from "./ChannelNames"
import { IRC_CONDITIONAL_STYLE, SERVER_NAMES_GROUP_TABS, SERV_MSG_NAMES_PANEL_STYLE } from "./style"
import { useState } from "react"
import UserInput from "./UserInput"
import Topic from "./Topic";

const IRC = ({ servers, names, message, settings, topic }) => {

  const [isServerSelected, setIsServerSelected] = useState(true);

  return (
    <>
      {isServerSelected ?
        <div className={IRC_CONDITIONAL_STYLE}>
          <Topic topic={topic} />
          <div className={SERV_MSG_NAMES_PANEL_STYLE}>
            <ServersAndChans setIsServerSelected={setIsServerSelected} servers={servers} />
            <MessageBox lines={message} settings={settings} />
          </div>
          <UserInput />
        </div>
        :
        <div className={IRC_CONDITIONAL_STYLE}>
          <Topic topic={topic} />
          <div className={SERV_MSG_NAMES_PANEL_STYLE}>
            <div className={SERVER_NAMES_GROUP_TABS}>
              <ServersAndChans setIsServerSelected={setIsServerSelected} servers={servers} />
              <ChannelNames names={names} />
            </div>
            <MessageBox lines={message} settings={settings} />
          </div>
          <UserInput />
        </div>
      }
    </>
  )
}

export default IRC
