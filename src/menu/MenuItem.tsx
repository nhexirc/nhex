import { emit } from '@tauri-apps/api/event';

const MenuItem = ({ children }) => {
  return (
    <button>
      <a href="#" onClick={() => emit(`nhex://menu/${children}`, {})}>
        {children}
      </a>
    </button>
  );
}

export default MenuItem;
