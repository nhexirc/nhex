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
  const unlisten = await listen("nhex://command/ack/quit", () => {
    realSetIsConnected(false);
    unlisten();
    resolve();
  });

  await emit("nhex://command/do", {
    ...getCurSelection(),
    ...(new UserInput("quit"))
  });

  return promise;
};
