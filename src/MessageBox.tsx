import { useRef } from "react";
import { listen } from '@tauri-apps/api/event';
import { MessageBoxLines } from './lib/types';
import { nickFromPrefix } from './lib/common';
import nickColor from './lib/nickColor';
import { MESSAGE_BOX, USERNAME_STYLE, JOIN_PART_MSG, JOIN_PART_MSG_DIM, GLOBAL_MESSAGE_STYLE } from "./style";

interface Props {
  lines: MessageBoxLines;
  settings: Record<string, any>;
};

const MessageBox = (props: Props) => {
  const mbRef = useRef(null);

  listen("nhex://servers_and_chans/selected", () => {
    mbRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  });

  const joinPartStyling = () => (JOIN_PART_MSG + " " + (
    props.settings.userSettings.MessageBox.dimJoinsAndParts ? JOIN_PART_MSG_DIM : ""
  ));

  const commands = {
    action(message: { params: [] }) {
      return ["*", message.params.slice(1).join(" "), "", ""];
    },
    privmsg(message: { params: [] }) {
      return ["<", message.params.slice(1).join(" "), ">", ""];
    },
    join(message: { params: string[] }) {
      console.log('J', props.settings.userSettings.MessageBox);
      return ["", `has joined ${message.params[1]}`, "", joinPartStyling()];
    },
    part(message: { params: string[] }) {
      let quitMsg = "";
      if (message.params[0] !== message.params[1]) {
        quitMsg = ` (${message.params[0].trim()})`;
      }
      console.log('P', props.settings.userSettings.MessageBox);
      return ["", `has left ${message.params[1]}${quitMsg}`, "", joinPartStyling()];
    },
  };

  // dont show our own join/part messages etc.
  const nonReflected = ["join", "part"];

  return (
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
                <div id={`mb_line_${i}`}>
                  {before}<span
                    className={`${isUs && USERNAME_STYLE}`}
                    style={{ color }}>
                    {nick}
                  </span>{after}
                  <span className={`${GLOBAL_MESSAGE_STYLE} ${msgStyleExtra}`}>
                    {$message}
                  </span>
                </div>
              );
            }
            return (
              <div id={`mb_line_${i}`}>
                {message.raw}
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default MessageBox
