import { CODE_ELEMENT_STYLE, LINK_ELEMENT_STYLE } from '../../style';
import { TOKEN } from "./parse";

export default class Node {
    parent: Node;
    children: Node[] = [];
    token;

    constructor(token) {
        this.token = token;
    }

    add(node: Node) {
        node.parent = this;
        this.children.push(node);
    }
    flat() {
        // anchor
        if (this.token?.type === TOKEN.TEXT) {
            return this.token.payload;
        }
        const children = this.children.map(child => child.flat());
        if (this.token === TOKEN.START_LINK) {
            return <a href={children[0]} target="_blank" className={LINK_ELEMENT_STYLE}>{children[0]}</a>;
        }
        if (this.token === TOKEN.START_BOLD) {
            return <strong>{...children}</strong>;
        }
        if (this.token === TOKEN.START_ITALIC) {
            return <i>{...children}</i>;
        }
        if (this.token === TOKEN.START_CODE) {
            return <code className={CODE_ELEMENT_STYLE}>{...children}</code>;
        }
        return [...children];
    }
};
