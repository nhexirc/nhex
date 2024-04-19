import nickColor from './lib/nickColor';
import {
  NAMES_PANEL_STYLE,
  SERVER_NAMES_PANEL_STYLE,
  UNIFORM_BORDER_STYLE,
  CHANNEL_NUMBERS_STYLE
} from './style';

interface Props {
  names: Set<string>;
}

const ChannelNames = (props: Props) => {
  const [ops, voiced, normies] = [...props.names]
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
    }, [[], [], []]);

  return (
    <div>
      <div className={`${CHANNEL_NUMBERS_STYLE} ${UNIFORM_BORDER_STYLE}`}>
        {ops.length ? <>{ops.length} op{ops.length > 1 ? 's' : ''}, </> : <></>}
        {ops.length + voiced.length + normies.length} users
      </div>
      <div className={`${SERVER_NAMES_PANEL_STYLE} ${NAMES_PANEL_STYLE} ${UNIFORM_BORDER_STYLE}`}>
        {[ops, voiced, normies]
          .map((inner) => inner.sort((a: string, b: string) =>
            a.toLowerCase() > b.toLowerCase() ? 1 : -1
          ))
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
    </div>
  );
}

export default ChannelNames
