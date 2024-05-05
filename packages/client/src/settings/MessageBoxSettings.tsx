import UserSettings from '../lib/userSettings';
import { MessageBoxValidFontSizes } from '../lib/types';
import { DAY_STYLE, NIGHT_STYLE, SETTINGS_HEADER, SETTINGS_INPUT_DAY, SETTINGS_INPUT_NIGHT, TEXT_OPTIONS } from "../style";
import ShowJoinPartSetting from './ShowJoinPartSetting';
import BoolSetting from './BoolSetting';
import TextSetting from './TextSetting';

const MessageBoxSettings = ({ isNight, settings, setSettings }) => {
  return (
    <>
      <div className={SETTINGS_HEADER + ' pt-0'}>Display</div>
      <div>
        <BoolSetting
          sectionName="MessageBox"
          fieldName="showTimestamps"
          isNight={isNight}
          settings={settings}
          setSettings={setSettings}>
          Timestamps
        </BoolSetting>
        <ShowJoinPartSetting which="join" isNight={isNight} settings={settings} setSettings={setSettings}>
        </ShowJoinPartSetting>
        <ShowJoinPartSetting which="part" isNight={isNight} settings={settings} setSettings={setSettings}>
        </ShowJoinPartSetting>
        <BoolSetting
          sectionName="Logging"
          fieldName="enable"
          isNight={isNight}
          settings={settings}
          setSettings={setSettings}>
          Logs
        </BoolSetting>
        <div className={SETTINGS_HEADER}>Dim</div>
        <BoolSetting
          sectionName="MessageBox"
          fieldName="dimJoinsAndParts"
          isNight={isNight}
          settings={settings}
          setSettings={setSettings}>
          Joins/Parts
        </BoolSetting>
        <p className={SETTINGS_HEADER}>Text Size</p>
        <select className={`${isNight ? NIGHT_STYLE + SETTINGS_INPUT_NIGHT : DAY_STYLE + SETTINGS_INPUT_DAY} ${TEXT_OPTIONS} border`}
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
        <p className={SETTINGS_HEADER}>Scrollback Line Limit</p>
        <TextSetting
          displayName="Scrollback Line Limit"
          sectionName="MessageBox"
          fieldName="scrollbackLimitLines"
          isNight={isNight}
          settings={settings}
          setSettings={setSettings}
          valueXform={Number}
        >
        </TextSetting>
      </div>
    </>
  );
}
export default MessageBoxSettings
