import nickColor from './lib/nickColor';

interface Props {
    names: Set<string>;
}

export default function ChannelNames(props: Props) {
    return (
        <div id="channel_names">
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
                        style={{color}}>
                            {name}
                        </div>
                    );
                })}
        </div>
    );
}