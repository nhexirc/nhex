import { TOPIC_BAR, TOPIC_USER_INPUT } from "./style";
const defaultTopic = "nhex v.0.1.2 :: nhex.dev :: irc.libera.chat #nhex"
const Topic = ({ topic }: { topic: string }) => {
  return (
    <textarea value={!topic ? defaultTopic : topic} cols={1} disabled className={`${TOPIC_USER_INPUT} ${TOPIC_BAR}`}>
    </textarea>
  )
};

export default Topic
