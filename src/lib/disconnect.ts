import { emit, listen } from '@tauri-apps/api/event';
import { UserInput } from './types';

export default async function (context: Record<any, any>) {
  const {
    STATE,
    realSetIsConnected,
    getCurSelection
  } = context;

  if (!STATE.connected) {
    return;
  }

  // when #33 is implemented properly, all the buffers, selections, etc. must be cleared here!

  let resolve;
  const promise = new Promise((res) => (resolve = res));
  const unlisten = await listen("nhex://user_input/quit/sent_ack", () => {
    realSetIsConnected(false);
    unlisten();
    resolve();
  });

  await emit("nhex://user_input/quit", {
    ...getCurSelection(),
    ...(new UserInput("quit"))
  });

  return promise;
};
