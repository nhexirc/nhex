import { emit } from '@tauri-apps/api/event';

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
    <div className='border'>
      {Object.entries(props.servers).map(([serverName, chans]) => {
        return (
          <div id={`server_${serverName}`}>
            <h3 onClick={(e) => emitSelect(serverName)}>{serverName}</h3>
            {chans.map((channel) => (
              <p id={`chan_${channel.replace("#", "_")}`} onClick={(e) => emitSelect(serverName, channel)}>
                {channel}
              </p>
            ))}
          </div>
        )
      })}
    </div>
  );
}
