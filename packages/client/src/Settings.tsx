import { useState, useEffect } from "react";
import UserSettings from './lib/userSettings';
import { UserSettingsIface } from './lib/types';
import MessageBoxSettings from './settings/MessageBoxSettings.tsx';
import NetworkSettings from './settings/NetworkSettings.tsx';
import DNDSettings from './settings/DNDSettings.tsx';
import { SETTINGS_SECTION_DAY, SETTINGS_SECTION_NIGHT, SETTINGS_STYLE } from "./style";

const Settings = ({ isNight }) => {
  const [settings, setSettings] = useState<UserSettingsIface>(null);

  useEffect(() => {
    async function getSettings() {
      setSettings(await UserSettings.load());
    }

    if (!settings) {
      getSettings();
    }
  });

  const sectionStyle = (isNight ? SETTINGS_SECTION_NIGHT : SETTINGS_SECTION_DAY) + " shadow-xl p-4 m-4 rounded";

  return (
    <div className={SETTINGS_STYLE}>
      <div className={sectionStyle}>
        <MessageBoxSettings isNight={isNight} settings={settings} setSettings={setSettings}>
        </MessageBoxSettings>
      </div>
      <div className={sectionStyle}>
        <NetworkSettings isNight={isNight} settings={settings} setSettings={setSettings}>
        </NetworkSettings>
      </div>
      <div className={sectionStyle}>
        <DNDSettings isNight={isNight} settings={settings} setSettings={setSettings}>
        </DNDSettings>
      </div>
    </div>
  );
}
export default Settings
