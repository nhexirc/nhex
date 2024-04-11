import { useRef } from "react";
import { listen } from '@tauri-apps/api/event';
import { MessageBoxLines, UserSettingsIface, IRCMessageParsed } from './lib/types';
import { nickFromPrefix } from './lib/common';
import nickColor from './lib/nickColor';
import {
  MESSAGE_BOX,
  USERNAME_STYLE,
  JOIN_PART_MSG,
  JOIN_PART_MSG_DIM,
  GLOBAL_MESSAGE_STYLE,
  TIMESTAMP_STYLE,
  UNIFORM_BORDER_STYLE,
  MESSAGE_HAS_HIGHLIGHT,
} from "./style";
import transformMessage from "./lib/transformMessage.jsx";

interface PropsSettings {
  userSettings: UserSettingsIface;
};

interface Props {
  lines: MessageBoxLines;
  settings: PropsSettings;
  STATE: Record<string, any>;
};

const MessageTimestampFormatOptions: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
  hour12: false,
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
    action(message: IRCMessageParsed) {
      return ["*", message.params.slice(1).join(" "), "", ""];
    },
    privmsg(message: IRCMessageParsed) {
      let extraStyle = message.highlightedUs ? MESSAGE_HAS_HIGHLIGHT : "";
      return ["<", message.params.slice(1).join(" "), ">", extraStyle];
    },
    join(message: IRCMessageParsed) {
      return ["", `has joined ${message.params[1]}`, "", joinPartStyling()];
    },
    part(message: IRCMessageParsed) {
      let quitMsg = "";
      if (message.params[0] !== message.params[1]) {
        quitMsg = ` (${message.params[0].trim()})`;
      }
      return ["", `has left ${message.params[1]}${quitMsg}`, "", joinPartStyling()];
    },
  };

  commands["notice"] = (message: IRCMessageParsed) => {
    const pmed = commands.privmsg(message);
    pmed[0] = "(notice) <";
    return pmed;
  }

  // dont show our own join/part messages etc.
  const nonReflected = ["join", "part"];

  let messageContainerStyle = "text-base";
  if (props.settings.userSettings.MessageBox?.fontSize) {
    messageContainerStyle = `text-${props.settings.userSettings.MessageBox?.fontSize}`;
  }

  return (
    <div className={`${MESSAGE_BOX} ${UNIFORM_BORDER_STYLE}`}>
      <div id="message_area" ref={mbRef}>
        {props.lines
          .filter(({ message }) => {
            if (message.fromServer) {
              return true;
            }
            const command = message.command.toLowerCase();

            if (!props.settings.userSettings.MessageBox.show.includes(command)) {
              return false;
            }

            return !message.fromUs || !nonReflected.includes(command);
          })
          .map(({ message }, i) => {
            const command = message.command.toLowerCase();
            let timestampEle = <></>;

            if (props.settings.userSettings.MessageBox?.showTimestamps === true) {
              timestampEle = <span className={TIMESTAMP_STYLE}>[{
                Intl.DateTimeFormat(undefined, MessageTimestampFormatOptions).format(new Date(message.timestamp))
              }]</span>;
            }

            if (!Object.keys(commands).includes(command)) {
              return (
                <div id={`mb_line_${i}`} className={messageContainerStyle}>
                  {timestampEle}
                  {transformMessage(message.raw)}
                </div>
              );
            }

            const nick = message.fromUs ? props.STATE.nick : nickFromPrefix(message.prefix);
            const color = nickColor(nick);
            const [before, $message, after, msgStyleExtra] = commands[command](message);

            return (
              <div id={`mb_line_${i}`} className={messageContainerStyle}>
                {timestampEle}
                {before}<span
                  className={`${message.fromUs && USERNAME_STYLE}`}
                  style={{ color }}>
                  {nick}
                </span>{after}
                <span className={`${GLOBAL_MESSAGE_STYLE} ${msgStyleExtra}`}>
                  {transformMessage($message)}
                </span>
              </div>
            );
          })}
      </div>
    </div >
  );
}

export default MessageBox
