import MainView from "./MainView";
import Menu from "./Menu";
import { ROOT_STYLE } from "./style";
import "./index.css";
import Footer from "./Footer";

const App = () => {
  return (
    <div className={ROOT_STYLE}>
      <Menu />
      <MainView />
      <Footer />
    </div>
  );
}

export default App;
