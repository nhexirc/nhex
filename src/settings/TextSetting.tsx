import UserSettings from '../lib/userSettings';
import { USER_INPUT_THEME_DAY, USER_INPUT_THEME_NIGHT, USER_INPUT } from "../style";

export default function ({ displayName, sectionName, fieldName, isNight, settings, setSettings }) {
  return (
    <>
      <tr>
        <td>{displayName}:</td>
        <td>
          <input
            className={`${isNight ? USER_INPUT_THEME_NIGHT : USER_INPUT_THEME_DAY} ${USER_INPUT}`}
            type="text"
            defaultValue={settings?.[sectionName]?.[fieldName]}
            onBlur={(e) => {
              UserSettings.save({
                ...settings,
                [sectionName]: {
                  ...settings?.[sectionName],
                  [fieldName]: e.target.value,
                }
              }).then((newSettings) => {
                setSettings(newSettings);
              })
            }} />
        </td>
      </tr>
    </>
  );
}