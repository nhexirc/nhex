import MenuItem from "./menu/MenuItem";
import { MENU_STYLE, ROW_STYLE } from "./style";
import sun from "./assets/sun.svg"
import moon from "./assets/moon.svg"
const Menu = ({ dayNightToggle, isNight }) => {
  const row1 = ["view", "server"];
  const row2 = ["settings", "window", "help"]

  return (
    <div className={MENU_STYLE}>
      <div className={ROW_STYLE}>
        <a href="https://github.com/nhexirc/client" target="_blank" className="font-bold">nhex</a>
        {row1.map((item, i) => <MenuItem key={i}>{item}</MenuItem>)}
      </div>
      <div className={ROW_STYLE}>
        {row2.map((item, i) => <MenuItem key={i}>{item}</MenuItem>)}
        <button onClick={dayNightToggle}>
          <img className="min-w-8 max-w-8" src={isNight ? sun : moon} alt="day/night toggle" />
        </button>
      </div>
    </div>
  );
}

export default Menu;
