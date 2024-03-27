import { IRCNicksSetStatusChars } from './IRCNicksSet'; 

const GLOBAL_NICK_COLORS = {};
const RGB_MIN = 75;

function pickNewColor() {
    return `rgb(${Array.from({ length: 3}).map(() => 
        // current formula is really only good for dark mode!
        Number(((Math.random() * (255 - RGB_MIN)) + RGB_MIN)).toFixed(0))})`;
}

export default function (nick: string): string {
    nick = IRCNicksSetStatusChars.reduce((a, n) => a.replace(n, ""), nick);

    if (!GLOBAL_NICK_COLORS[nick]) {
        GLOBAL_NICK_COLORS[nick] = pickNewColor();
    }

    return GLOBAL_NICK_COLORS[nick];
}