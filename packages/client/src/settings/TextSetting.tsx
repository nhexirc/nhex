import UserSettings from '../lib/userSettings';
import { DAY_STYLE, NIGHT_STYLE, SETTINGS_INPUT_DAY, SETTINGS_INPUT_NIGHT } from "../style";

export default function(props: any) {
  const { displayName, sectionName, fieldName, isNight, settings, setSettings } = props;
  const valueXform = props?.valueXform ?? ((x: any) => x);
  const displayXform = props?.displayXform ?? ((x: any) => x);

  return (
    <>
      <input
        className={`${isNight ? NIGHT_STYLE + SETTINGS_INPUT_NIGHT : DAY_STYLE + SETTINGS_INPUT_DAY} border p-1`}
        type="text"
        defaultValue={displayXform(settings?.[sectionName]?.[fieldName])}
        placeholder={displayName}
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
    </>
  );
}
