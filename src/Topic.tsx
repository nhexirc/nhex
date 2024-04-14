import { TOPIC_BAR, TOPIC_USER_INPUT, TOPIC_USER_THEME_DAY, TOPIC_USER_THEME_NIGHT, UNIFORM_BORDER_STYLE } from "./style";
import { version } from '../package.json';

const defaultTopic = `nhex v${version} :: nhex.dev :: irc.libera.chat #nhex`
const Topic = ({ topic, isNight }) => {
  return (
    <textarea value={!topic ? defaultTopic : topic} cols={1} disabled className={`${TOPIC_USER_INPUT} ${TOPIC_BAR} ${UNIFORM_BORDER_STYLE} ${isNight ? TOPIC_USER_THEME_NIGHT : TOPIC_USER_THEME_DAY} sticky top-0 w-full`}>
    </textarea>
  )
};

export default Topic
