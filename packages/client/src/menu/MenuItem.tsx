import { emit } from '@tauri-apps/api/event';

const MenuItem = ({ children, triggerFunc, state }) => {
  return (
    <button className={(state?.[children] && "underline")}>
      <a href="#" onClick={triggerFunc}>
        {children}
      </a>
    </button>
  );
}

export default MenuItem;
