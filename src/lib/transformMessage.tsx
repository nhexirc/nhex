import extract_urls from 'extract-urls';
import {
  LINK_ELEMENT_STYLE
} from "../style";

function jsxElementsFromMessage(message: string) {
  let origMsg = message;
  let messageElems = [<>{message}</>];
  const foundLinks = extract_urls(message);

  if (foundLinks?.length) {
    messageElems = foundLinks.map((l) => {
      const linkDex = origMsg.indexOf(l);
      const next = (<>
        <span>{origMsg.slice(0, linkDex)}</span>
        <span><a href={l} target="_blank" className={LINK_ELEMENT_STYLE}>{l}</a></span>
      </>);
      origMsg = origMsg.slice(linkDex + l.length);
      return next;
    });

    // handle trailing text, if any
    if (origMsg.length) {
      messageElems.push(<><span>{origMsg}</span></>);
    }
  }

  return messageElems;
}

export default function(message: string) {
    return jsxElementsFromMessage(message);
}
