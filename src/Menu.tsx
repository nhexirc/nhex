import MenuItem from "./menu/MenuItem"

const Menu = () => {
  const items = ["nhex", "view", "server", "settings", "window", "help"]
  return (
    <div className="flex gap-2 justify-center">
      {items.map((item) => <MenuItem>{item}</MenuItem>)}
    </div>
  )
}

export default Menu
