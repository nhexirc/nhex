import { TOKEN } from "./parse";
import Node from "./Node.tsx";

export default (tokens: any[]) => {
    const root = new Node(undefined);
    let current = root;
    for (const token of tokens) {
        if (token.type === TOKEN.TEXT) {
            current.add(new Node(token));
        }
        if (token === TOKEN.START_LINK || token === TOKEN.START_BOLD || token === TOKEN.START_ITALIC) {
            const next = new Node(token);
            current.add(next);
            current = next;
        }
        if (token === TOKEN.END_LINK || token === TOKEN.END_BOLD || token === TOKEN.END_ITALIC) {
            current = current.parent;
        }
    }
    return root.flat();
}
