import TextSetting from './TextSetting';
import BoolSetting from './BoolSetting';

export default function ({ isNight, settings, setSettings }) {
  return (
    <>
      <div className="text-2xl mb-4">Network</div>
      <div>
        <table className="w-full">
          <tbody>
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
              displayName="Use TLS"
              sectionName="Network"
              fieldName="tls"
              isNight={isNight}
              settings={settings}
              setSettings={setSettings}>
            </BoolSetting>
          </tbody>
        </table>
      </div>
    </>
  );
}