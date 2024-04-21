import { useRef, useState, useEffect } from "react";
import { listen } from '@tauri-apps/api/event';
import { MessageBoxLines, UserSettingsIface, IRCMessageParsed } from './lib/types';
import { nickFromPrefix } from './lib/common';
import nickColor from './lib/nickColor';
import {
  USERNAME_STYLE,
  JOIN_PART_MSG,
  JOIN_PART_MSG_DIM,
  GLOBAL_MESSAGE_STYLE,
  TIMESTAMP_STYLE,
  UNIFORM_BORDER_STYLE,
  MESSAGE_HAS_HIGHLIGHT,
  MESSAGEBOX,
  MESSAGES_WINDOW,
} from "./style";
import transformMessage from "./lib/message-transformer/exports.js";
import UserInput from "./UserInput";
import Topic from "./Topic";
import Menu from "./Menu";
import MenuTriggers from './menu/triggers';
import UserSettings from './lib/userSettings';

const MessageTimestampFormatOptions: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
  hour12: false,
};

const TopicMessagesInput = ({ lines, STATE, nick, isNight, dayNightToggle, topic, menuTriggers, menuState }: {
  lines: MessageBoxLines,
  STATE: Record<string, any>,
  nick: string,
  isNight: any,
  dayNightToggle: any,
  topic: string,
  menuTriggers: MenuTriggers,
  menuState: Record<string, boolean>
}) => {
  const mbRef = useRef(null);
  const [settings, setSettings] = useState<UserSettingsIface>(null);

  useEffect(() => {
    async function getSettings() {
      setSettings(await UserSettings.load());
    }

    if (!settings) {
      getSettings();
    }
  });

  listen("nhex://servers_and_chans/selected", () => {
    mbRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  });

  const joinPartStyling = () => (JOIN_PART_MSG + " " + (
    settings?.MessageBox.dimJoinsAndParts ? JOIN_PART_MSG_DIM : ""
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
  if (settings?.MessageBox?.fontSize) {
    messageContainerStyle = `text-${settings?.MessageBox?.fontSize} pl-2`;
  }

  return (
    <div className={`${MESSAGEBOX} ${UNIFORM_BORDER_STYLE}`}>
      <div>
        <div className="sticky top-0 backdrop-blur-lg">
          <Menu dayNightToggle={dayNightToggle} isNight={isNight} menuTriggers={menuTriggers} state={menuState} />
          <Topic topic={topic} />
        </div>
        <div ref={mbRef} className={MESSAGES_WINDOW}>
          {lines
            .filter(({ message }) => {
              if (message.fromServer) {
                return true;
              }
              const command = message.command.toLowerCase();

              if (!settings?.MessageBox.show.includes(command)) {
                return false;
              }

              return !message.fromUs || !nonReflected.includes(command);
            })
            .map(({ message }, i: any) => {
              const command = message.command.toLowerCase();
              let timestampEle = <></>;

              if (settings?.MessageBox?.showTimestamps === true) {
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

              const nick = message.fromUs ? STATE.nick : nickFromPrefix(message.prefix);
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
      </div>
      <UserInput nick={nick} isNight={isNight} />
    </div >
  );
}

export default TopicMessagesInput
