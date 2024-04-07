import MenuItem from "./menu/MenuItem";
import { MENU_STYLE } from "./style";
import sun from "./assets/sun.svg"
import moon from "./assets/moon.svg"
const Menu = ({ dayNightToggle, isNight }) => {
  const items = ["view", "server", "settings", "window", "help"];

  return (
    <div className={MENU_STYLE}>
      <a href="https://github.com/nhexirc/client" target="_blank" className="font-bold">nhex</a>
      {items.map((item, i) => <MenuItem key={i}>{item}</MenuItem>)}
      <button onClick={dayNightToggle}><img className="w-8" src={isNight ? sun : moon} alt="day/night toggle" /></button>
    </div>
  );
}

export default Menu;
