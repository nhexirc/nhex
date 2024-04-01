import { TOPIC_BAR, TOPIC_USER_INPUT } from "./style";

const Topic = ({ topic }) => {
  return (
    <div className={`${TOPIC_USER_INPUT} ${TOPIC_BAR}`}>
      {topic}
    </div>
  )
};

export default Topic
