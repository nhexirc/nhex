import { SETTINGS_HEADER } from '../style';
import BoolSetting from './BoolSetting';

const LoginSettings = ({ isNight, settings, setSettings }) => {
  return (
    <>
      <BoolSetting
        sectionName="Logging"
        fieldName="enable"
        isNight={isNight}
        settings={settings}
        setSettings={setSettings}>
        <p className={SETTINGS_HEADER}>Logging</p>
      </BoolSetting>
    </>
  );
}
export default LoginSettings
