import UserSettings from '../lib/userSettings';
import { DAY_STYLE, NIGHT_STYLE, USER_INPUT_CB } from "../style";

export default function({ displayName, sectionName, fieldName, isNight, settings, setSettings }) {
  return (
    <>
      <tr>
        <td>{displayName}:</td>
        <td>
          <input
            className={`${isNight ? NIGHT_STYLE : DAY_STYLE} ${USER_INPUT_CB}`}
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
        </td>
      </tr>
    </>
  );
}
