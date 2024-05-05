import UserSettings from '../lib/userSettings';
import { DAY_STYLE, NIGHT_STYLE, SETTINGS_ALIGNMENT, USER_INPUT_CHECKBOX } from "../style";

export default function({ which, isNight, settings, setSettings }) {
  const displayText = which[0].toUpperCase() + which.slice(1) + 's'
  return (
    <div className={SETTINGS_ALIGNMENT}>
      <input
        className={`${isNight ? NIGHT_STYLE : DAY_STYLE} ${USER_INPUT_CHECKBOX}`}
        type="checkbox"
        checked={settings?.MessageBox?.show.includes(which)}
        onChange={(e) => {
          const newShowSet = new Set(settings?.MessageBox?.show);
          newShowSet[e.target.checked ? "add" : "delete"](which);
          UserSettings.save({
            ...settings,
            MessageBox: {
              ...settings.MessageBox,
              show: [...newShowSet]
            }
          }).then((newSettings) => setSettings(newSettings));
        }} />
      <p>{displayText}</p>
    </div>
  );
}
