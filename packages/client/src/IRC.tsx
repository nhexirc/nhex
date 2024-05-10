import ServersAndChans from "./ServersAndChans";
import ChannelNames from "./ChannelNames";
import { IRC_STYLE, SERV_MSG_NAMES_PANEL_STYLE } from "./style";
import { useState } from "react";
import TopicMessagesInput from "./TopicMessagesInput";
import { listen } from '@tauri-apps/api/event';
import { SACSelect } from './lib/types';

let serverIsSelectedSetter;
listen("nhex://servers_and_chans/select", (event: { payload: SACSelect }) => {
  serverIsSelectedSetter?.(event.payload?.channel === "");
})

const IRC = ({ servers, names, message, nick, isNight, dayNightToggle, topic, getCurSelection, getBuffers, STATE, menuTriggers, menuState }) => {
  const [isServerSelected, setIsServerSelected] = useState(true);
  serverIsSelectedSetter = setIsServerSelected;
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
