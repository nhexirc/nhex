import { TOPIC_BAR, TOPIC_USER_INPUT } from "./style";

const Topic = ({ topic }) => {
  return (
    <textarea placeholder={topic} rows={1} disabled className={`${TOPIC_USER_INPUT} ${TOPIC_BAR}`}>
    </textarea>
  )
};

export default Topic
