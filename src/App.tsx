import MainView from "./MainView";
import Menu from "./Menu";
import { DAY_STYLE, NIGHT_STYLE, ROOT_STYLE } from "./style";
import "./index.css";
import Footer from "./Footer";
import { useState } from "react";

const App = () => {
  const [isNight, setIsNight] = useState(true);

  const dayNightToggle = () => {
    setIsNight(!isNight);
  }
  return (
    <div className={`${ROOT_STYLE} ${isNight ? NIGHT_STYLE : DAY_STYLE}`}>
      <Menu dayNightToggle={dayNightToggle} isNight={isNight} />
      <MainView />
      <Footer />
    </div >
  );
}

export default App;
