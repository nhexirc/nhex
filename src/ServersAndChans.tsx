import { emit } from '@tauri-apps/api/event';
import { SERVER_NAMES_PANEL_STYLE, SERVER_PANEL_STYLE } from './style';
import { Dispatch, SetStateAction } from 'react';
import { SACProps } from './lib/types';

const ServersAndChans = ({ servers, setIsServerSelected }: { servers: SACProps, setIsServerSelected: Dispatch<SetStateAction<boolean>> }) => {
  function emitServer(server: string, channel: string = "") {
    setIsServerSelected(channel === "");
    emit("nhex://servers_and_chans/select", { server, channel })
  }

  return (
    <div className={`${SERVER_NAMES_PANEL_STYLE} ${SERVER_PANEL_STYLE}`}>
      {Object.entries(servers).map(([serverName, chans]) => {
        return (
          <button id={`server_${serverName}`} className='text-right'>
            <h3 className='font-bold' onClick={() => emitServer(serverName)}>{serverName}</h3>
            {chans.sort().map((channel: string) => (
              <p id={`chan_${channel.replace("#", "_")}`} onClick={() => emitServer(serverName, channel)}>
                {channel}
              </p>
            ))}
          </button>
        )
      })}
    </div>
  );
}

export default ServersAndChans;
