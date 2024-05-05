import UserSettings from '../lib/userSettings';
import { DAY_STYLE, NIGHT_STYLE, SETTINGS_ALIGNMENT, USER_INPUT_CHECKBOX } from "../style";

export default function({ children, sectionName, fieldName, isNight, settings, setSettings }) {
  return (
    <div className={SETTINGS_ALIGNMENT}>
      <input
        className={`${isNight ? NIGHT_STYLE : DAY_STYLE} ${USER_INPUT_CHECKBOX}`}
        type="checkbox"
        checked={settings?.[sectionName]?.[fieldName]}
        onChange={(e) => {
          UserSettings.save({
            ...settings,
            [sectionName]: {
              ...settings?.[sectionName],
              [fieldName]: e.target.checked
            }
          }).then((newSettings) => setSettings(newSettings));
        }} />
      <p>{children}</p>
    </div>
  );
}
