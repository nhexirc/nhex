const IRCNicksSetStatusChars = ['@', '+'];

export default class IRCNicksSet extends Set {
    _internalNick(rawNick: string): string {
        return IRCNicksSetStatusChars.reduce((a, n) => a.replace(n, ''), rawNick);
    }

    _deleteAll(internalNick: string) {
        ['', ...IRCNicksSetStatusChars].forEach((statusChar) => super.delete(`${statusChar}${internalNick}`));
    }

    _getCurrentHat(value: string): string {
        if (this.has(value)) {
            return ['', ...IRCNicksSetStatusChars].find((statusChar) =>
                super.has(`${statusChar}${this._internalNick(value)}`))[0] || '';
        }

        return '';
    }

    has(value: string): boolean {
        return ['', ...IRCNicksSetStatusChars].some((statusChar) =>
            super.has(`${statusChar}${this._internalNick(value)}`));
    }

    add(value: string): this {
        if (this.has(value)) {
            this._deleteAll(this._internalNick(value));
        }

        return super.add(value);
    }

    delete(value: string): boolean {
        const extant = this.has(value);
        this._deleteAll(this._internalNick(value));
        return extant;
    }
};