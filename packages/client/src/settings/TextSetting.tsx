import UserSettings from '../lib/userSettings';
import { DAY_STYLE, NIGHT_STYLE } from "../style";

export default function(props: any) {
  const { displayName, sectionName, fieldName, isNight, settings, setSettings } = props;
  const valueXform = props?.valueXform ?? ((x: any) => x);
  const displayXform = props?.displayXform ?? ((x: any) => x);

  return (
    <>
      <input
        className={`${isNight ? NIGHT_STYLE : DAY_STYLE}`}
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
