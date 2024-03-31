import { emit } from "@tauri-apps/api/event";
import { USER_INPUT } from "./style";
import { completeNickname } from "./MainView";

const UserInput = () => {

  let prefix = "";
  return (
    <input type="text" className={USER_INPUT} autoFocus onKeyDown={(e) => {
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
        const userInput = e.currentTarget.value.trim();
        e.currentTarget.value = "";

        const uiSplit = userInput.split(" ");
        const command = userInput.match(/^\s*\/(\w+)/)?.[1] ?? "";

        const args = uiSplit.slice((command === "") ? 0 : 1);
        emit("nhex://user_input/raw", {
          raw: userInput,
          command,
          args,
          argsStr: args.join(" "),
        }).catch(console.error);
      }
    }} />
  )
}

export default UserInput
