import MainView from "./MainView";
import Menu from "./Menu";
import "./styles.css";
function App() {
  return (
    <div className="bg-zinc-900 text-zinc-300 border">
      <Menu />
      <MainView />
    </div>
  );
}

export default App;
