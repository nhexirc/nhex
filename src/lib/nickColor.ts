import { IRCNicksSetStatusChars } from './IRCNicksSet';
import PALETTE from "./palette.json" assert { type: "json" }

const GLOBAL_NICK_COLORS = {};
function generateColor(name: string, palette: string[]): string {
  return palette[[...name].map(c => c.charCodeAt(0)).reduce((a, b) => a + b) % palette.length]
}

export default function(nick: string): string {
  nick = IRCNicksSetStatusChars.reduce((a, n) => a.replace(n, ""), nick);

  if (!GLOBAL_NICK_COLORS[nick]) {
    GLOBAL_NICK_COLORS[nick] = generateColor(nick, PALETTE);
  }

  return GLOBAL_NICK_COLORS[nick];
}
