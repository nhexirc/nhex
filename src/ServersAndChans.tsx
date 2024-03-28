import { emit } from '@tauri-apps/api/event';
import { SERVER_CHAN_USER_PANEL_STYLE } from './style';

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


function emitSelect(server: string, channel: string = "") {
  emit("nhex://servers_and_chans/select", { server, channel })
}

export default function ServersAndChans(props: SACProps) {
  return (
    <div className={`${SERVER_CHAN_USER_PANEL_STYLE} text-right`}>
      {Object.entries(props.servers).map(([serverName, chans]) => {
        return (
          <button id={`server_${serverName}`} className='text-right'>
            <h3 className='font-bold' onClick={(e) => emitSelect(serverName)}>{serverName}</h3>
            {chans.map((channel) => (
              <p id={`chan_${channel.replace("#", "_")}`} onClick={(e) => emitSelect(serverName, channel)}>
                {channel}
              </p>
            ))}
          </button>
        )
      })}
    </div>
  );
}
