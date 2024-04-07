import { TOPIC_BAR, TOPIC_USER_INPUT, UNIFORM_BORDER_STYLE } from "./style";
import { version } from '../package.json';

const defaultTopic = `nhex v${version} :: nhex.dev :: irc.libera.chat #nhex`
const Topic = ({ topic }: { topic: string }) => {
  return (
    <textarea value={!topic ? defaultTopic : topic} cols={1} disabled className={`${TOPIC_USER_INPUT} ${TOPIC_BAR} ${UNIFORM_BORDER_STYLE}`}>
    </textarea>
  )
};

export default Topic
