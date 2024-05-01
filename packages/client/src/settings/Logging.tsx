import BoolSetting from './BoolSetting';

export default function ({ isNight, settings, setSettings }) {
  return (
    <>
      <div className="text-2xl mb-4">Logging</div>
      <div>
        <table className="w-full">
          <tbody>
            <BoolSetting
              displayName="Enabled"
              sectionName="Logging"
              fieldName="enable"
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