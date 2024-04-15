import { emit } from "@tauri-apps/api/event";
import { TOPIC_USER_INPUT, USER_INPUT_THEME_DAY, USER_INPUT_THEME_NIGHT, UNIFORM_BORDER_STYLE, USER_INPUT } from "./style";
import { completeNickname } from "./MainView";
import { parseMBUserInputRaw } from './lib/common';

const UserInput = ({ nick, isNight }) => {
  const inputFunctionality = (e: any) => {
    if (e.key === "Tab") {
      const [first, ...rest] = e.currentTarget.value.split(" ");
      if (prefix === "") {
        prefix = first;
      }
      const completed = completeNickname(prefix, first);
      e.currentTarget.value = [completed,
        ...rest.filter((r: string) => r !== "")].join(" ")
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
  }
  let prefix = "";
  return (
    <input type="text" className={`${TOPIC_USER_INPUT} ${UNIFORM_BORDER_STYLE} ${isNight ? USER_INPUT_THEME_NIGHT : USER_INPUT_THEME_DAY} ${USER_INPUT}`} autoFocus placeholder={nick} onKeyDown={inputFunctionality} />
  )
}

export default UserInput
