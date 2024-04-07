import { emit } from "@tauri-apps/api/event";
import { TOPIC_USER_INPUT, UNIFORM_BORDER_STYLE, USER_INPUT } from "./style";
import { completeNickname } from "./MainView";
import { parseMBUserInputRaw } from './lib/common';

const UserInput = () => {

  let prefix = "";
  return (
    <input type="text" className={`${TOPIC_USER_INPUT} ${USER_INPUT} ${UNIFORM_BORDER_STYLE}`} autoFocus onKeyDown={(e) => {
      if (e.key === "Tab") {
        const [first, ...rest] = e.currentTarget.value.split(" ");
        if (prefix === "") {
          prefix = first;
        }
        const completed = completeNickname(prefix, first);
        e.currentTarget.value = [completed,
          ...rest.filter(r => r !== "")].join(" ")
        e.preventDefault();
        // prevent reseting prefix, for cycling through
        return;
      }
      // reset prefix
      prefix = "";
      if (e.key === "Enter") {
        const userInput = parseMBUserInputRaw(e.currentTarget.value);
        e.currentTarget.value = "";
        emit("nhex://user_input/raw", userInput).catch(console.error);
      }
    }} />
  )
}

export default UserInput
