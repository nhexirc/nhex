import TextSetting from './TextSetting';
import BoolSetting from './BoolSetting';
import { SETTINGS_HEADER } from '../style';

const NetworkSettings = ({ isNight, settings, setSettings }) => {
  return (
    <div className='flex flex-col gap-2'>
      <div className={SETTINGS_HEADER + ' pt-0'}>Network</div>
      <TextSetting
        displayName="Server"
        sectionName="Network"
        fieldName="server"
        isNight={isNight}
        settings={settings}
        setSettings={setSettings}>
      </TextSetting>
      <TextSetting
        displayName="Port"
        sectionName="Network"
        fieldName="port"
        isNight={isNight}
        settings={settings}
        setSettings={setSettings}>
      </TextSetting>
      <TextSetting
        displayName="Nickname"
        sectionName="Network"
        fieldName="nick"
        isNight={isNight}
        settings={settings}
        setSettings={setSettings}>
      </TextSetting>
      <TextSetting
        displayName="Channels"
        sectionName="Network"
        fieldName="channels"
        isNight={isNight}
        settings={settings}
        setSettings={setSettings}>
      </TextSetting>
      <BoolSetting
        sectionName="Network"
        fieldName="tls"
        isNight={isNight}
        settings={settings}
        setSettings={setSettings}>
        TLS
      </BoolSetting>
    </div>
  );
}
export default NetworkSettings
