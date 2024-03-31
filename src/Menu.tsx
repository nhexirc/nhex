import MenuItem from "./menu/MenuItem"
import { MENU_STYLE, NHEX } from "./style"

const Menu = () => {

  const items = ["view", "server", "settings", "window", "help"]

  return (
    <div className={MENU_STYLE}>
      <a href="https://github.com/nhexirc/client" target="_blank" className={NHEX}>nhex</a>
      {items.map((item, i) => <MenuItem key={i}>{item}</MenuItem>)}
    </div>
  )
}

export default Menu
