import MainView from "./MainView";
import { DAY_STYLE, NIGHT_STYLE, ROOT_STYLE } from "./style";
import "./index.css";
import { useState, useEffect } from "react";
import { setCurrentTheme } from './lib/nickColor';
import MenuTriggers from './menu/triggers';
import UserDB from './lib/userDB';

const menuTriggers = new MenuTriggers([
  ["view", "server"],
  ["settings", "window"],
]);

const db = new UserDB();
db.init().then(() => console.log('User DB initialized'));

const App = () => {
  const [isNight, setIsNight] = useState(true);
  const [menuState, setMenuState] = useState({ settings: false });

  const dayNightToggle = () => {
    setIsNight(!isNight);
    setCurrentTheme(isNight ? 'light' : 'dark');
  };

  function toggleUserSettings() {
    setMenuState({
      ...menuState,
      settings: !menuState.settings
    });
  }

  useEffect(() => {
    menuTriggers.addHandler("settings", toggleUserSettings);

    return () => {
      menuTriggers.removeHandler("settings", toggleUserSettings);
    };
  });

  return (
    <div className={`${ROOT_STYLE} ${isNight ? NIGHT_STYLE : DAY_STYLE}`}>
      <MainView
        dayNightToggle={dayNightToggle}
        isNight={isNight}
        menuTriggers={menuTriggers}
        menuState={menuState}
        db={db}
      />
    </div >
  );
}

export default App;
