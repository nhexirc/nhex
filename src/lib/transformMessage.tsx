import extract_urls from 'extract-urls';
import {
  LINK_ELEMENT_STYLE
} from "../style";

const chunk = (strings, ...dynChunks) => strings.map((string, i) => <>
    {string !== "" ? <span>{string}</span> : ""}
    {dynChunks[i] !== undefined ? <span>
        <a href={dynChunks[i]} target="_blank" className={LINK_ELEMENT_STYLE}>
            {dynChunks[i]}
        </a>
    </span> : ""}
</>);

function jsxElementsFromMessage(message: string) {
  const foundLinks = extract_urls(message);

  if (foundLinks !== undefined) {
    const prepared = foundLinks.reduce((message, l, i) =>
        message.replace(l, `\$\{links[${i}]\}`), message);
    return new Function("links", "chunk", `return chunk\`${prepared}\``)(foundLinks, chunk);
  }

  return [<>{message}</>];
}

export default function(message: string) {
    return jsxElementsFromMessage(message);
}
