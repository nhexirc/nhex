import ServersAndChans from "./ServersAndChans"
import MessageBox from "./MessageBox"
import ChannelNames from "./ChannelNames"
import { IRC_CONDITIONAL_STYLE, SERV_MSG_NAMES_PANEL_STYLE } from "./style"
import { useState } from "react"
import UserInput from "./UserInput"
import Topic from "./Topic";

const IRC = ({ servers, names, message, settings, topic, getCurSelection, getBuffers }) => {

  const [isServerSelected, setIsServerSelected] = useState(true);

  if (isServerSelected) {
    return (<>
      <div className={IRC_CONDITIONAL_STYLE}>
        <Topic topic={topic} />
        <div className={SERV_MSG_NAMES_PANEL_STYLE}>
          <ServersAndChans setIsServerSelected={setIsServerSelected} servers={servers} getCurSelection={getCurSelection} getBuffers={getBuffers} />
          <MessageBox lines={message} settings={settings} />
        </div>
        <UserInput />
      </div>
    </>);
  }

  return (
    <>
      <div className={IRC_CONDITIONAL_STYLE}>
        <Topic topic={topic} />
        <div className={SERV_MSG_NAMES_PANEL_STYLE}>
          <ServersAndChans setIsServerSelected={setIsServerSelected} servers={servers} getCurSelection={getCurSelection} getBuffers={getBuffers} />
          <MessageBox lines={message} settings={settings} />
          <ChannelNames names={names} />
        </div>
        <UserInput />
      </div>
    </>
  );
}

export default IRC
