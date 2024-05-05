import UserSettings from '../lib/userSettings';
import { DAY_STYLE, NIGHT_STYLE, USER_INPUT_CHECKBOX } from "../style";

export default function({ which, isNight, settings, setSettings }) {
  return (
    <>
      <tr>
        <td>Show {which}s:</td>
        <td>
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
        </td>
      </tr>
    </>
  );
}
