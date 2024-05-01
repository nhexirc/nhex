import BoolSetting from './BoolSetting';
import TextSetting from './TextSetting';

export default function ({ isNight, settings, setSettings }) {
  return (
    <>
      <div className="text-2xl mb-4">Drag-and-Drop</div>
      <div>
        <table className="w-full">
          <tbody>
            <BoolSetting
              displayName="Enabled"
              sectionName="DragAndDrop"
              fieldName="enable"
              isNight={isNight}
              settings={settings}
              setSettings={setSettings}>
            </BoolSetting>

            <TextSetting
              displayName="Allowed text file extensions"
              sectionName="DragAndDrop"
              fieldName="textFileExtensions"
              isNight={isNight}
              settings={settings}
              setSettings={setSettings}
              displayXform={(l) => l?.join(" ")}
              valueXform={(s) => s?.split(" ")}
            >
            </TextSetting>

            <TextSetting
              displayName="Upload host"
              sectionName="DragAndDrop"
              fieldName="textUploadHost"
              isNight={isNight}
              settings={settings}
              setSettings={setSettings}>
            </TextSetting>
          </tbody>
        </table>
      </div>
    </>
  );
}