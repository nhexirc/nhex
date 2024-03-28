import nickColor from './lib/nickColor';
import { SERVER_CHAN_USER_PANEL_STYLE } from './style';

interface Props {
  names: Set<string>;
}

export default function ChannelNames(props: Props) {
  return (
    <div className={SERVER_CHAN_USER_PANEL_STYLE}>
      {[...props.names]
        .reduce((a, cur) => {
          const [ops, voiced, normies] = a;
          let target = normies;

          if (cur.indexOf("@") === 0) {
            target = ops;
          } else if (cur.indexOf("+") === 0) {
            target = voiced;
          }

          target.push(cur);
          return a;
        }, [[], [], []])
        .map((inner) => inner.sort())
        .flat()
        .map((name) => {
          const color = nickColor(name);
          return (
            <div
              id={`channel_name__${name.replace(/\W*/, '')}`}
              style={{ color }}>
              {name}
            </div>
          );
        })}
    </div>
  );
}
