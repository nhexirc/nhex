import MenuItem from "./menu/MenuItem"

const Menu = () => {
  return (
    <div className="flex gap-2 justify-center">
      <MenuItem>nhex</MenuItem>
      <MenuItem>view</MenuItem>
      <MenuItem>server</MenuItem>
      <MenuItem>settings</MenuItem>
      <MenuItem>window</MenuItem>
      <MenuItem>help</MenuItem>
    </div>
  )
}

export default Menu
