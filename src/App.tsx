import MainView from "./MainView";
import { DAY_STYLE, NIGHT_STYLE, ROOT_STYLE } from "./style";
import "./index.css";
import { useState } from "react";
import { setCurrentTheme } from './lib/nickColor';

const App = () => {
  const [isNight, setIsNight] = useState(true);

  const dayNightToggle = () => {
    setIsNight(!isNight);
    setCurrentTheme(isNight ? 'light' : 'dark');
  };

  return (
    <div className={`${ROOT_STYLE} ${isNight ? NIGHT_STYLE : DAY_STYLE}`}>
      <MainView dayNightToggle={dayNightToggle} isNight={isNight} />
    </div >
  );
}

export default App;
