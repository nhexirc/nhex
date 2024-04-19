import { TOKEN } from "./parse";
import Node from "./Node.tsx";

export default (tokens: any[]) => {
    const root = new Node(undefined);
    let current = root;
    for (const token of tokens) {
        if (token.type === TOKEN.TEXT) {
            current.add(new Node(token));
        }
        if ([TOKEN.START_LINK, TOKEN.START_BOLD, TOKEN.START_ITALIC, TOKEN.START_CODE].includes(token)) {
            const next = new Node(token);
            current.add(next);
            current = next;
        }
        if ([TOKEN.END_LINK, TOKEN.END_BOLD, TOKEN.END_ITALIC, TOKEN.END_CODE].includes(token)) {
            current = current.parent;
        }
    }
    return root.flat();
}
