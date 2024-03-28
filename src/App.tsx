import MainView from "./MainView";
import Menu from "./Menu";
import { ROOT_STYLE } from "./style";
import "./index.css";
function App() {
  return (
    <div className={ROOT_STYLE}>
      <Menu />
      <MainView />
    </div>
  );
}

export default App;
