import UserSettings from '../lib/userSettings';
import { USER_INPUT_THEME_DAY, USER_INPUT_THEME_NIGHT, USER_INPUT } from "../style";

export default function (props) {
  const { displayName, sectionName, fieldName, isNight, settings, setSettings } = props;
  const valueXform = props?.valueXform ?? ((x) => x);

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
                  [fieldName]: valueXform(e.target.value),
                }
              }).then((newSettings) => {
                setSettings(newSettings);
              })
            }}
            />
        </td>
      </tr>
    </>
  );
}