enum State {
    Text,
    StartBold,
    StartItalic,
    InBold,
    InItalic,
    Link,
    LinkInBold,
    LinkInItalic,
};

const TOKEN = {
    START_BOLD: Symbol("start-bold"),
    END_BOLD: Symbol("end-bold"),
    START_ITALIC: Symbol("start-italic"),
    END_ITALIC: Symbol("end-italic"),
    TEXT: Symbol("text"),
    START_LINK: Symbol("start-link"),
    END_LINK: Symbol("end-link"),
};

const HTTP = "http://";
const HTTPS = "https://";

const EOF = undefined;
const ASTERISK = "*";
const UNDERSCORE = "_";
const SPACE = " ";

const Parser = class Parser {
    #input: string;
    #pos: number = -1;
    #state: State = State.Text;
    #stateData: {
        marker?: string,
    } = {};
    #buffer: string = "";
    #tokens: any[] = [];

    constructor(input: string) {
        this.#input = input;
    }

    get current() {
        return this.#input[this.#pos];
    }

    get previous() {
        return this.#input[this.#pos - 1];
    }

    next(end: number = 1) {
        return this.#input.slice(this.#pos, this.#pos + end);
    }

    #yield(token: any) {
        this.#tokens.push(token);
    }

    // commits the current buffer as a text token
    #commit() {
        if (this.#buffer.length > 0) {
            const buffer = this.#buffer;
            // empty buffer
            this.#buffer = "";
            this.#yield({
                type: TOKEN.TEXT,
                payload: buffer,
            })
        }
    }


    eat(state: State = this.#state, stateData: object = this.#stateData) {
        this.#pos++;
        this.#state = state;
        this.#stateData = stateData;

        switch (state) {
            case State.Text:
                return this.#s_text();
            case State.StartItalic:
                return this.#s_start_italic();
            case State.StartBold:
                return this.#s_start_bold();
            case State.InItalic:
                return this.#s_in_italic();
            case State.InBold:
                return this.#s_in_bold();
            case State.Link:
                return this.#s_link();
            case State.LinkInBold:
                return this.#s_link_in_bold();
            case State.LinkInItalic:
                return this.#s_link_in_italic();
        }
    }

    // -> early bailout, if EOF
    // -> StartItalic, if * or _
    // -> Link, if http:// or https://
    // -> repeat otherwise
    #s_text() {
        const { current } = this;

        switch (current) {
            // early bailout, just commit
            case EOF:
                this.#commit();
                return;
            case ASTERISK: case UNDERSCORE:
                return this.eat(State.StartItalic, { marker: current });
            case "h": case "H":
                if (this.next(HTTP.length).toLowerCase() === HTTP
                 || this.next(HTTPS.length).toLowerCase() === HTTPS) {
                    this.#commit();
                    this.#yield(TOKEN.START_LINK);
                    this.#buffer += current;
                    this.eat(State.Link);
                    return;
                }
                // fallthrough to default
            default:
                this.#buffer += current;
                this.eat(/* keep state */);
                return;
        }
    }

    // -> early bailout, if EOF
    // -> Text, if space
    // -> repeat otherwise
    #s_link() {
        const { current } = this;

        switch (current) {
            // early bailout, commit & close for user
            case EOF:
                this.#commit();
                this.#yield(TOKEN.END_LINK);
                return;
            case SPACE:
                this.#commit();
                this.#yield(TOKEN.END_LINK);
                this.#buffer += current;
                this.eat(State.Text);
                return;
            default:
                this.#buffer += current;
                this.eat(/* keep state */);
                return;
        }
    }

    // -> StartBold, if * or _ and current equals previous
    // -> LinkInItalic, if http:// or https://
    // -> InItalic otherwise
    #s_start_italic() {
        const { current } = this;

        this.#commit();

        switch (current) {
            case ASTERISK: case UNDERSCORE:
                if (current === this.previous) {
                    this.#yield(TOKEN.START_BOLD);
                    this.eat(State.StartBold, { marker: current });
                    return;
                }
                // fall through
            case "h": case "H":
                if (this.next(HTTP.length).toLowerCase() === HTTP
                 || this.next(HTTPS.length).toLowerCase() === HTTPS) {
                    this.#yield(TOKEN.START_ITALIC);
                    this.#yield(TOKEN.START_LINK);
                    this.#buffer += current;
                    this.eat(State.LinkInItalic);
                    return;
                }
                // fall through to default
            default:
                this.#yield(TOKEN.START_ITALIC);
                this.#buffer += current;
                this.eat(State.InItalic);
        }
    }

    // -> early bailout, if EOF
    // -> Text, if * or _
    // -> LinkInItatic, if http:// or https://
    // -> repeat otherwise
    #s_in_italic() {
        const { current } = this;

        switch (current) {
            // early bailout: the tag hasn't been closed, so backtrack in #tokens
            // and remove the StartItalic token
            case EOF:
               if (this.#tokens.length < 1 || this.#tokens.slice(-1)[0] !== TOKEN.START_ITALIC) {
                  console.error('Parse error: unterminated italic; missing start token!',
                     current, this.#state, this.#tokens, this.#buffer);
                  return;
               }

               this.#tokens = this.#tokens.slice(0, -1);
               this.#commit();
               return;
            case ASTERISK: case UNDERSCORE:
                if (current === this.#stateData.marker) {
                    this.#commit();
                    this.#yield(TOKEN.END_ITALIC);
                    this.eat(State.Text);
                    return;
                }
                // fall through
            case "h": case "H":
                if (this.next(HTTP.length).toLowerCase() === HTTP
                 || this.next(HTTPS.length).toLowerCase() === HTTPS) {
                    this.#commit();
                    this.#yield(TOKEN.START_LINK);
                    this.#buffer += current;
                    this.eat(State.LinkInItalic);
                    return;
                }
                // fallthrough to default
            default:
                this.#buffer += current;
                this.eat(/* keep state */);
        }
    }

    // -> early bailout, if EOF
    // -> InItalic, if space
    // -> Text, if * or _
    // -> repeat otherwise
    #s_link_in_italic() {
        const { current } = this;

        switch (current) {
            // early bailout, commit & close both for user
            case EOF:
               this.#commit();
               this.#yield(TOKEN.END_LINK);
               this.#yield(TOKEN.END_ITALIC);
               return;
            case SPACE:
                this.#commit();
                this.#yield(TOKEN.END_LINK);
                this.eat(State.InItalic);
                return;
            case ASTERISK: case UNDERSCORE:
                if (current === this.#stateData.marker) {
                    this.#commit();
                    this.#yield(TOKEN.END_LINK);
                    this.#yield(TOKEN.END_ITALIC);
                    this.eat(State.Text);
                    return;
                }
            default:
                this.#buffer += current;
                this.eat(/* keep state */);
                return;
        }
    }

    // -> LinkInBold, if http:// or https://
    // -> InBold otherwise
    #s_start_bold() {
        const { current } = this;

        switch (current) {
            case "h": case "H":
                if (this.next(HTTP.length).toLowerCase() === HTTP
                 || this.next(HTTPS.length).toLowerCase() === HTTPS) {
                    this.#commit();
                    this.#yield(TOKEN.START_LINK);
                    this.#buffer += current;
                    this.eat(State.LinkInBold);
                    return;
                }
                // fallthrough to default
            default:
                this.#buffer += current;
                this.eat(State.InBold);
                return;
        }
    }

    // -> early bailout, if EOF
    // -> Text, if * or _ and current equals next
    // -> LinkInBold, if http:// or https://
    // -> repeat otherwise
    #s_in_bold() {
        const { current } = this;

        switch (current) {
            // early bailout, commit & close for user
            case EOF:
               if (this.#tokens.length < 1 || this.#tokens.slice(-1)[0] !== TOKEN.START_BOLD) {
                  console.error('Parse error: unterminated bold; missing start token!',
                     current, this.#state, this.#tokens, this.#buffer);
                  return;
               }

               this.#tokens = this.#tokens.slice(0, -1);
               this.#commit();
               return;
            case ASTERISK: case UNDERSCORE:
                if (current === this.#stateData.marker && current === this.next(1)) {
                    this.#commit();
                    this.#yield(TOKEN.END_BOLD);
                    // ignore next character
                    this.#pos++;
                    this.eat(State.Text);
                    return;
                }
                // fall through
            case "h": case "H":
                if (this.next(HTTP.length).toLowerCase() === HTTP
                 || this.next(HTTPS.length).toLowerCase() === HTTPS) {
                    this.#commit();
                    this.#yield(TOKEN.START_LINK);
                    this.#buffer += current;
                    this.eat(State.LinkInBold);
                    return;
                }
                // fall through to default
            default:
                this.#buffer += current;
                this.eat(/* keep state */);
        }
    }

    // -> early bailout, if EOF
    // -> InBold, if space
    // -> Text, if * or _ and current equals next
    // -> repeat otherwise
    #s_link_in_bold() {
        const { current } = this;

        switch (current) {
            // early bailout, commit & close both for user
            case EOF:
               this.#commit();
               this.#yield(TOKEN.END_LINK);
               this.#yield(TOKEN.END_BOLD);
               return;
            case SPACE:
                this.#commit();
                this.#yield(TOKEN.END_LINK);
                this.eat(State.InBold);
                return;
            case ASTERISK: case UNDERSCORE:
                if (current === this.#stateData.marker && current === this.next(1)) {
                    this.#commit();
                    this.#yield(TOKEN.END_LINK);
                    this.#yield(TOKEN.END_BOLD);
                    // skip "*"
                    this.#pos++;
                    this.eat(State.Text);
                    return;
                }
            default:
                this.#buffer += current;
                this.eat(/* keep state */);
        }
    }

    parse() {
        this.eat(State.Text);
        return this.#tokens;
    }
}

export default (raw: string) => new Parser(raw).parse();

export { TOKEN };
