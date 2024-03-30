import MenuItem from "./menu/MenuItem"
import { MENU_LOGO, MENU_STYLE } from "./style"

const Menu = () => {

  const items = ["view", "server", "settings", "window", "help"]

  return (
    <div className={MENU_STYLE}>
      <a href="https://github.com/nhexirc/client" target="_blank" className={MENU_LOGO}>NHEX</a>
      {items.map((item, i) => <MenuItem key={i}>{item}</MenuItem>)}
    </div>
  )
}

export default Menu
