import UserSettings from '../lib/userSettings';
import { USER_INPUT_THEME_DAY, USER_INPUT_THEME_NIGHT, USER_INPUT_CB } from "../style";

export default function ({ which, isNight, settings, setSettings }) {
  return (
    <>
      <tr>
        <td>Show {which}s:</td>
        <td>
          <input
            className={`${isNight ? USER_INPUT_THEME_NIGHT : USER_INPUT_THEME_DAY} ${USER_INPUT_CB}`}
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