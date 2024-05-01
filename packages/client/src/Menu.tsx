import MenuItem from "./menu/MenuItem";
import { MENU_STYLE, ROW_STYLE } from "./style";
import sun from "./assets/sun.svg";
import moon from "./assets/moon.svg";

const Menu = ({ dayNightToggle, isNight, menuTriggers, state }) => {
  const [row1, row2] = menuTriggers.items;

  return (
    <div className={MENU_STYLE}>
      <div className={ROW_STYLE}>
        <a href="https://nhex.dev" target="_blank">nhex</a>
        {row1.map((item, i) => <MenuItem triggerFunc={menuTriggers.trigger.bind(menuTriggers, item)} key={i} state={state}>{item}</MenuItem>)}
      </div>
      <div className={ROW_STYLE}>
        {row2.map((item, i) => <MenuItem triggerFunc={menuTriggers.trigger.bind(menuTriggers, item)} key={i} state={state}>{item}</MenuItem>)}
        <a href="https://nhex.dev/docs" target="_blank">help</a>
        <button onClick={dayNightToggle}>
          <img className="min-w-5 max-w-5" src={isNight ? sun : moon} alt="day/night toggle" />
        </button>
      </div>
    </div>
  );
}

export default Menu;
