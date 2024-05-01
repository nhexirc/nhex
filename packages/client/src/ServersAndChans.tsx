import { emit } from '@tauri-apps/api/event';
import {
  SERVER_NAMES_PANEL_STYLE,
  SERVER_PANEL_STYLE,
  SERVER_CHANNEL_DIRTY,
  SERVER_CHANNEL_SELECTED,
  SERVER_CHANNEL_HAS_HIGHLIGHTS,
  UNIFORM_BORDER_STYLE,
} from './style';
import { Dispatch, SetStateAction } from 'react';
import { SACProps, SACSelect, NetworkBuffer } from './lib/types';

const ServersAndChans = ({ servers, setIsServerSelected, getCurSelection, getBuffers }: {
  servers: SACProps,
  setIsServerSelected: Dispatch<SetStateAction<boolean>>,
  getCurSelection: () => SACSelect,
  getBuffers: () => Record<string, NetworkBuffer>
}) => {
  function emitServer(server: string, channel: string = "") {
    setIsServerSelected(channel === "");
    emit("nhex://servers_and_chans/select", { server, channel })
  }

  const cs = getCurSelection();
  return (
    <div className={`${SERVER_NAMES_PANEL_STYLE} ${SERVER_PANEL_STYLE} ${UNIFORM_BORDER_STYLE}`}>
      {Object.entries(servers).map(([serverName, chans]) => {
        const serverBuf = getBuffers()[serverName];
        const serverDirty = cs.server === serverName && serverBuf.buffers[""].isDirty();
        const serverSelected = cs.server === serverName && cs.channel === "";
        const dynServerClasses = (serverDirty ? SERVER_CHANNEL_DIRTY : '') + ' ' +
          (serverSelected ? SERVER_CHANNEL_SELECTED : '');

        return (
          <button id={`server_${serverName}`} className='text-right'>
            <h3
              className={`font-bold ${dynServerClasses}`}
              onClick={() => {
                serverBuf.buffers[""].cleanup();
                emitServer(serverName);
              }}>
              {serverName}
            </h3>
            {chans.sort().map((channel: string) => {
              const chanDirty = cs.server === serverName && cs.channel !== channel && serverBuf.buffers[channel].isDirty();
              const chanHasHighlights = chanDirty && serverBuf.buffers[channel].dirty.highlight > 0;
              const selectedChan = cs.server === serverName && cs.channel === channel;
              return (<p
                id={`chan_${channel.replace("#", "_")}`}
                onClick={() => {
                  serverBuf.buffers[channel].cleanup();
                  emitServer(serverName, channel);
                }}
                className={
                  (chanHasHighlights ? SERVER_CHANNEL_HAS_HIGHLIGHTS : '') + ' ' +
                  (chanDirty ? SERVER_CHANNEL_DIRTY : '') + ' ' +
                  (selectedChan ? SERVER_CHANNEL_SELECTED : '')
                }
              >
                {channel}
              </p>);
            })}
          </button>
        )
      })}
    </div>
  );
}

export default ServersAndChans;
