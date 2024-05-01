export type MenuItemTriggerCallback = (itemName: string) => void;

export default class MenuTriggers {
  // each inner list is a separate row in mobile view
  items: string[][] = [];
  #triggers: Record<string, Set<MenuItemTriggerCallback>> = {};

  constructor(items: string[][]) {
    this.items = items;
    this.#removeAllHandlers();
  }

  trigger(itemName: string) {
    this.#triggers[itemName]?.forEach((callback) => callback(itemName));
  };

  addHandler(itemName: string, triggerCallback) {
    this.#triggers[itemName]?.add(triggerCallback);
  };

  removeHandler(itemName: string, handler) {
    this.#triggers[itemName]?.delete(handler);
  }

  #removeAllHandlers() {
    this.#triggers = this.items.flat().reduce((a, t) => ({ [t]: new Set(), ...a }), {});
  };
};
