import { emit } from '@tauri-apps/api/event';
import { SERVER_CHAN_USER_PANEL_STYLE, SERVER_PANEL_STYLE } from './style';
import { Dispatch, SetStateAction } from 'react';

export type SACServers = Record<string, string[]>;
export interface SACProps {
  servers: SACServers;
};

export interface SACSelect {
  server: string;
  channel: string;
};

export interface SACSelectEvent {
  payload: SACSelect
};

const ServersAndChans = ({ servers, setIsServerSelected }: { servers: SACProps, setIsServerSelected: Dispatch<SetStateAction<boolean>> }) => {

  function emitServer(server: string) {
    setIsServerSelected(true);
    emit("nhex://servers_and_chans/select", { server })
  }
  //this works better with server still attached, but it blows the server log out. needs further decoupling on a deeper level i am unfamiliar with -v
  function emitChannel(server: string, channel: string = "") {
    setIsServerSelected(false);
    emit("nhex://servers_and_chans/select", { server, channel })
  }

  return (
    <div className={`${SERVER_CHAN_USER_PANEL_STYLE} ${SERVER_PANEL_STYLE}`}>
      {Object.entries(servers).map(([serverName, chans]) => {
        return (
          <button id={`server_${serverName}`} className='text-right'>
            <h3 className='font-bold' onClick={() => emitServer(serverName)}>{serverName}</h3>
            {chans.sort().map((channel: string) => (
              <p id={`chan_${channel.replace("#", "_")}`} onClick={() => emitChannel(serverName, channel)}>
                {channel}
              </p>
            ))}
          </button>
        )
      })}
    </div>
  );
}

export default ServersAndChans
