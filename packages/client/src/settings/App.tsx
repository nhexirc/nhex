import BoolSetting from './BoolSetting';

export default function ({ isNight, settings, setSettings }) {
  return (
    <>
      <div className="text-2xl mb-4">App</div>
      <div>
        <table className="w-full">
          <tbody>
            <BoolSetting
              displayName="Enable Logging"
              sectionName="App"
              fieldName="enableLogging"
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