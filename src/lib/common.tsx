export function nickFromPrefix(prefix: string): string {
    const bangdex = prefix.indexOf("!");

    if (bangdex > 0) {
        prefix = prefix.slice(0, bangdex);
    }

    return prefix;
}
