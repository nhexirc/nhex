import { useState, useEffect } from "react";
import UserSettings from './lib/userSettings';
import { UserSettingsIface } from './lib/types';
import LoggingSettings from './settings/LoggingSettings.tsx';
import MessageBoxSettings from './settings/MessageBoxSettings.tsx';
import NetworkSettings from './settings/NetworkSettings.tsx';
import DNDSettings from './settings/DNDSettings.tsx';
import { SETTINGS_STYLE } from "./style";

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

  const sectionStyle = (isNight ? "bg-slate-800" : "bg-orange-800/40") + " p-4 m-4 rounded";

  return (
    <div className={SETTINGS_STYLE}>

      <div className={sectionStyle}>
        <DNDSettings isNight={isNight} settings={settings} setSettings={setSettings}>
        </DNDSettings>
      </div>

      <div className={sectionStyle}>
        <LoggingSettings isNight={isNight} settings={settings} setSettings={setSettings}>
        </LoggingSettings>
      </div>

      <div className={sectionStyle}>
        <MessageBoxSettings isNight={isNight} settings={settings} setSettings={setSettings}>
        </MessageBoxSettings>
      </div>

      <div className={sectionStyle}>
        <NetworkSettings isNight={isNight} settings={settings} setSettings={setSettings}>
        </NetworkSettings>
      </div>
    </div>
  );
}
export default Settings
