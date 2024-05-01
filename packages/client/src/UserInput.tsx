import { emit, listen } from '@tauri-apps/api/event';
import { TOPIC_USER_INPUT, UNIFORM_BORDER_STYLE, USER_INPUT, NIGHT_STYLE, DAY_STYLE } from "./style";
import { completeNickname } from "./MainView";
import { parseMBUserInputRaw } from './lib/common';
import { useRef } from "react";

let inputRef;

function processingString(event: { payload: { file: string, host: string } }) {
  const { file, host } = event.payload;
  return `[⌛ uploading "${file}" to "${host}" ⌛]`;
}

listen("nhex://file-drop/processing", (event: { payload: { file: string, host: string } }) => {
  if (!inputRef) {
    console.error('inputRef not yet set?!');
    return;
  }

  inputRef.current.value += processingString(event);
});

listen("nhex://file-drop/confirmed", (event: { payload: { file: string, host: string, url: string } }) => {
  if (!inputRef) {
    console.error('inputRef not yet set?!');
    return;
  }

  inputRef.current.value = inputRef.current.value.replace(processingString(event), "");
  inputRef.current.value += event.payload.url;
});

const UserInput = ({ nick, isNight }) => {
  inputRef = useRef(null);

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
    <>
      <input
        ref={inputRef}
        type="text"
        className={`${TOPIC_USER_INPUT} ${UNIFORM_BORDER_STYLE} ${isNight ? NIGHT_STYLE : DAY_STYLE} ${USER_INPUT}`}
        autoFocus
        placeholder={nick}
        onKeyDown={inputFunctionality}
      />
    </>
  )
}

export default UserInput
