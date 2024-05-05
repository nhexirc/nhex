import { SETTINGS_ALIGNMENT, SETTINGS_HEADER } from '../style';
import BoolSetting from './BoolSetting';
import TextSetting from './TextSetting';

export default function({ isNight, settings, setSettings }) {
  return (
    <div className="flex flex-col gap-2">
      <BoolSetting
        sectionName="DragAndDrop"
        fieldName="enable"
        isNight={isNight}
        settings={settings}
        setSettings={setSettings}>
        <p className={SETTINGS_HEADER}>Drag and Drop</p>
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
    </div>
  );
}
