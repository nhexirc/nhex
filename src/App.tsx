import "./App.css";
import ConnectBox from "./ConnectBox";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "./shadcn/MenuBar";

function App() {
  return (
    <div id="app_container">
      <Menubar id="main_menubar">
        <MenubarMenu>
          <MenubarTrigger>NhexChat</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={(e) => {
              alert('new tab!');
            }}>
              One
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Two</MenubarItem>
            <MenubarSeparator />
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Server</MenubarTrigger>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Settings</MenubarTrigger>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Window</MenubarTrigger>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Help</MenubarTrigger>
        </MenubarMenu>
      </Menubar>

      <ConnectBox />
    </div>
  );
}

export default App;
