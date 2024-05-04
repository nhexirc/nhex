import UserSettings from '../lib/userSettings';
import { MessageBoxValidFontSizes } from '../lib/types';
import { DAY_STYLE, NIGHT_STYLE } from "../style";
import ShowJoinPartSetting from './ShowJoinPartSetting';
import BoolSetting from './BoolSetting';
import TextSetting from './TextSetting';

const MessageBoxSettings = ({ isNight, settings, setSettings }) => {
  return (
    <>
      <div className="text-2xl mb-4">Message Display</div>
      <div>
        <table className="w-full">
          <tbody>
            <BoolSetting
              displayName="Show timestamps"
              sectionName="MessageBox"
              fieldName="showTimestamps"
              isNight={isNight}
              settings={settings}
              setSettings={setSettings}>
            </BoolSetting>

            <ShowJoinPartSetting which="join" isNight={isNight} settings={settings} setSettings={setSettings}>
            </ShowJoinPartSetting>

            <ShowJoinPartSetting which="part" isNight={isNight} settings={settings} setSettings={setSettings}>
            </ShowJoinPartSetting>

            <BoolSetting
              displayName="Dim joins &amp; parts"
              sectionName="MessageBox"
              fieldName="dimJoinsAndParts"
              isNight={isNight}
              settings={settings}
              setSettings={setSettings}>
            </BoolSetting>

            <tr>
              <td>Font size:</td>
              <td>
                <select className={`${isNight ? NIGHT_STYLE : DAY_STYLE}`}
                  onChange={(e) => {
                    UserSettings.save({
                      ...settings,
                      MessageBox: {
                        ...settings?.MessageBox,
                        fontSize: e.target.selectedOptions[0].value
                      }
                    }).then((newSettings) => setSettings(newSettings));
                  }}>
                  {MessageBoxValidFontSizes.map((size) => (<>
                    <option value={size} selected={size === settings?.MessageBox?.fontSize}>
                      {size}
                    </option>
                  </>))}
                </select>
              </td>
            </tr>

            <TextSetting
              displayName="Channel scrollback line limit"
              sectionName="MessageBox"
              fieldName="scrollbackLimitLines"
              isNight={isNight}
              settings={settings}
              setSettings={setSettings}
              valueXform={Number}
            >
            </TextSetting>
          </tbody>
        </table>
      </div>
    </>
  );
}
export default MessageBoxSettings
