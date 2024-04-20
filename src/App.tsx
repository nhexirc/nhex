import MainView from "./MainView";
import { DAY_STYLE, NIGHT_STYLE, ROOT_STYLE } from "./style";
import "./index.css";
import { useState, useEffect } from "react";
import { setCurrentTheme } from './lib/nickColor';
import { register, unregisterAll } from '@tauri-apps/api/globalShortcut';
import { emit } from '@tauri-apps/api/event';

const GlobalShortcuts = [
  // If the first element starts with "nhex://", it will be used as the event name,
  // otherwise it will be appended to "nhex://global_shortcut/".
  // This name field is required - instead of using the key combo spec directly - because:
  // "Event name must include only alphanumeric characters, `-`, `/`, `:` and `_`"
  ["C-K", "CommandOrControl+K"],
  ["nhex://menu/settings", "CommandOrControl+S"],
  ["nhex://menu/view", "CommandOrControl+V"],
];

const App = () => {
  const [isNight, setIsNight] = useState(true);

  const dayNightToggle = () => {
    setIsNight(!isNight);
    setCurrentTheme(isNight ? 'light' : 'dark');
  };

  useEffect(() => {
    Promise.all(GlobalShortcuts.map(([name, shortcut]) => register(shortcut, () => {
      const eventName = name.indexOf("nhex://") === 0 ? name : `nhex://global_shortcut/${name}`;
      emit(eventName, { shortcut });
    }))).catch(console.error);

    return () => {
      unregisterAll();
    };
  }, []);

  return (
    <div className={`${ROOT_STYLE} ${isNight ? NIGHT_STYLE : DAY_STYLE}`}>
      <MainView dayNightToggle={dayNightToggle} isNight={isNight} />
    </div >
  );
}

export default App;
