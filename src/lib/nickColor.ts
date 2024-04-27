import { IRCNicksSetStatusChars } from './IRCNicksSet';
import dark from "./palettes/dark.json" assert { type: "json" };
import light from "./palettes/light.json" assert { type: "json" };

let GLOBAL_NICK_COLORS = {};
const PALLETTES = { dark, light };
const CURRENT_THEME_STATE = {
  name: 'dark'
};

function generateColor(name: string, palette: string[]): string {
  return palette[[...name].map(c => c.charCodeAt(0)).reduce((a, b) => a + b) % palette.length]
}

export function setCurrentTheme(themeName: string) {
  CURRENT_THEME_STATE.name = themeName;
  GLOBAL_NICK_COLORS = {};
}

export default function(nick: string | undefined | null): string {
  nick = IRCNicksSetStatusChars.reduce((a, n) => a.replace(n, ""), nick || "SERVER");

  if (!GLOBAL_NICK_COLORS[nick]) {
    GLOBAL_NICK_COLORS[nick] = generateColor(nick, PALLETTES[CURRENT_THEME_STATE.name]);
  }

  return GLOBAL_NICK_COLORS[nick];
}
