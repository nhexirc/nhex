import "./App.css";
import MainView from "./MainView";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "./shadcn/MenuBar";
import "./styles.css";

function App() {
  return (
    <div id="app_container">
      <Menubar id="main_menubar">
        <MenubarMenu>
          <MenubarTrigger>nhex</MenubarTrigger>
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

      <MainView />
    </div>
  );
}

export default App;
