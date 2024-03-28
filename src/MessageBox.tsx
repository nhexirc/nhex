import { useRef } from "react";
import { emit, listen } from '@tauri-apps/api/event';
import { MessageBoxLines } from './lib/types';
import { nickFromPrefix } from './lib/common';
import nickColor from './lib/nickColor';
import { completeNickname } from "./MainView";
import { MESSAGE_BOX, USERNAME_STYLE, USER_INPUT, USER_MESSAGE_STYLE } from "./style";

interface Props {
  lines: MessageBoxLines;
};

export default function MessageBox(props: Props) {
  const mbRef = useRef(null);
  let prefix = "";
  listen("nhex://servers_and_chans/selected", () => {
    mbRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  });
  return (
    <div>
      <div className={MESSAGE_BOX}>
        <div id="message_area" ref={mbRef}>
          {props.lines.map(({ message, isUs }, i) => {
            if (message.command.toLowerCase() === "privmsg") {
              const nick = nickFromPrefix(message.prefix);
              const color = nickColor(nick);
              return (
                <>
                  <div id={`mb_line_${i}`}>
                    &lt;<span
                      className={`${USERNAME_STYLE} ${isUs ? 'ourName' : ''}`}
                      style={{ color }}>
                      {nick}
                    </span>&gt;
                    <span className={`${USER_MESSAGE_STYLE} ${isUs ? 'ourMessage' : ''}`}>
                      {message.params.slice(1).join(" ")}
                    </span>
                  </div>
                </>
              );
            }
            return (
              <>
                <div id={`mb_line_${i}`}>
                  {message.raw}
                </div>
              </>
            );
          })}
        </div>
      </div>
      <div>
        <input type="text" className={USER_INPUT} placeholder=">" onKeyDown={(e) => {
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
            const userInput = e.currentTarget.value;
            e.currentTarget.value = "";

            const uiSplit = userInput.split(" ");
            let command = "privmsg";

            if (userInput[0] === "/") {
              command = uiSplit[0].slice(1);
            }

            const args = uiSplit.slice((command === "privmsg") ? 0 : 1);
            console.error("TEST", userInput, command, args)
            emit("nhex://user_input/raw", {
              raw: userInput,
              command,
              args,
              argsStr: args.join(" "),
            }).catch(console.error);
          }
        }} />
      </div>
    </div>
  );
}
