import { useRef, useState, useEffect } from "react";
import { listen } from '@tauri-apps/api/event';
import { MessageBoxLines, UserSettingsIface, } from './lib/types';
import {
  UNIFORM_BORDER_STYLE,
  MESSAGEBOX,
  MESSAGES_WINDOW,
} from "./style";
import UserInput from "./UserInput";
import Topic from "./Topic";
import Menu from "./Menu";
import MenuTriggers from './menu/triggers';
import UserSettings from './lib/userSettings';
import IRCChat from "./IRCChat";
import Settings from "./Settings";

const TopicMessagesInput = ({ lines, STATE, nick, isNight, dayNightToggle, topic, menuTriggers, menuState }: {
  lines: MessageBoxLines,
  STATE: Record<string, any>,
  nick: string,
  isNight: any,
  dayNightToggle: any,
  topic: string,
  menuTriggers: MenuTriggers,
  menuState: Record<string, boolean>
}) => {

  const mbRef = useRef(null);
  const [settings, setSettings] = useState<UserSettingsIface>(null);

  listen("nhex://servers_and_chans/selected", () => {
    mbRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  });

  useEffect(() => {
    async function getSettings() {
      setSettings(await UserSettings.load());
    }

    if (!settings) {
      getSettings();
    }
  });

  let messageContainerStyle = "text-base";

  if (settings?.MessageBox?.fontSize) {
    messageContainerStyle = `text-${settings?.MessageBox?.fontSize} pl-2`;
  }

  return (
    <div className={`${MESSAGEBOX} ${UNIFORM_BORDER_STYLE}`}>
      <div>
        <div className="sticky top-0 backdrop-blur-lg">
          <Menu dayNightToggle={dayNightToggle} isNight={isNight} menuTriggers={menuTriggers} state={menuState} />
          <Topic topic={topic} />
        </div>
        {menuState.settings ?
          <Settings isNight={isNight} />
          :
          <>
            <div ref={mbRef} className={MESSAGES_WINDOW}>
              <IRCChat lines={lines} STATE={STATE} settings={settings} messageContainerStyle={messageContainerStyle} />
            </div>
            <UserInput nick={nick} isNight={isNight} />
          </>
        }
      </div>
    </div >
  );
}

export default TopicMessagesInput
