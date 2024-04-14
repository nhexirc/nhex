import MenuItem from "./menu/MenuItem";
import { DAY_STYLE, MENU_STYLE, NIGHT_STYLE, ROW_STYLE } from "./style";
import sun from "./assets/sun.svg";
import moon from "./assets/moon.svg";

const Menu = ({ dayNightToggle, isNight }) => {
  const row1 = ["view", "server"];
  const row2 = ["settings", "window", "help"];

  return (
    <div className={`${MENU_STYLE} ${isNight ? NIGHT_STYLE : DAY_STYLE}`}>
      <div className={ROW_STYLE}>
        <a href="https://github.com/nhexirc/client" target="_blank" className="font-bold">nhex</a>
        {row1.map((item, i) => <MenuItem key={i}>{item}</MenuItem>)}
      </div>
      <div className={ROW_STYLE}>
        {row2.map((item, i) => <MenuItem key={i}>{item}</MenuItem>)}
        <button onClick={dayNightToggle}>
          <img className="min-w-5 max-w-5" src={isNight ? sun : moon} alt="day/night toggle" />
        </button>
      </div>
    </div>
  );
}

export default Menu;
