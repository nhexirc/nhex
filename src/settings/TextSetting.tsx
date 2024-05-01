import UserSettings from '../lib/userSettings';
import { DAY_STYLE, NIGHT_STYLE, USER_INPUT } from "../style";

export default function(props) {
  const { displayName, sectionName, fieldName, isNight, settings, setSettings } = props;
  const valueXform = props?.valueXform ?? ((x) => x);

  return (
    <>
      <tr>
        <td>{displayName}:</td>
        <td>
          <input
            className={`${isNight ? NIGHT_STYLE : DAY_STYLE} ${USER_INPUT}`}
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
