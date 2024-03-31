import { useRef } from "react";
import { emit, listen } from '@tauri-apps/api/event';
import { MessageBoxLines } from './lib/types';
import { nickFromPrefix } from './lib/common';
import nickColor from './lib/nickColor';
import { completeNickname } from "./MainView";
import { MESSAGE_BOX, USERNAME_STYLE, USER_INPUT, USER_MESSAGE_STYLE } from "./style";

interface Props {
  lines: MessageBoxLines;
  settings: Record<string, any>;
};

const MessageBox = (props: Props) => {
  const mbRef = useRef(null);
  let prefix = "";
  listen("nhex://servers_and_chans/selected", () => {
    mbRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  });
  const commands = {
    action(message: { params: [] }) {
        return ["*", message.params.slice(1).join(" "), "", ""];
    },
    privmsg(message: { params: [] }) {
        return ["<", message.params.slice(1).join(" "), ">", ""];
    },
    join(message: { params: string[] }) {
        return ["", `has joined ${message.params[1]}`, "", "italic"];
    },
    part(message: { params: string[] }) {
        return ["", `has left ${message.params[1]}`, "", "italic"];
    },
  };
  // dont show our own join/part messages etc.
  const nonReflected = ["join", "part"];

  return (
    <div>
      <div className={MESSAGE_BOX}>
        <div id="message_area" ref={mbRef}>
          {props.lines
            .filter(({ message, isUs }) => {
                if (message.fromServer) {
                    return true;
                }

                const command = message.command.toLowerCase();
                
                if (!props.settings.userSettings.MessageBox.show.includes(command)) {
                  return false;
                }

                return !isUs || !nonReflected.includes(command);
            })
            .map(({ message, isUs }, i) => {
            const command = message.command.toLowerCase();
            if (Object.keys(commands).includes(command)) {
              const nick = nickFromPrefix(message.prefix);
              const color = nickColor(nick);
              const [before, $message, after, msgStyleExtra] = commands[command](message);
              return (
                <>
                  <div id={`mb_line_${i}`}>
                    {before}<span
                      className={`${USERNAME_STYLE} ${isUs ? 'ourName' : ''}`}
                      style={{ color }}>
                      {nick}
                    </span>{after}
                    <span className={`${USER_MESSAGE_STYLE} ${isUs ? 'ourMessage' : ''} ${msgStyleExtra}`}>
                      {$message}
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
        <input type="text" className={USER_INPUT} onKeyDown={(e) => {
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
      </div>
    </div>
  );
}

export default MessageBox
