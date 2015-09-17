/* global JSON */
import MobiledocParser from '../parsers/mobiledoc';
import HTMLParser from '../parsers/html';

export function parsePostFromPaste(pasteEvent, builder) {
  let mobiledoc, post;
  const mobiledocRegex = new RegExp(/data\-mobiledoc='(.*)'>/);

  let html = pasteEvent.clipboardData.getData('text/html');

  if (mobiledocRegex.test(html)) {
    let mobiledocString = html.match(mobiledocRegex)[1];
    mobiledoc = JSON.parse(mobiledocString);
    post = new MobiledocParser(builder).parse(mobiledoc);
  } else {
    post = new HTMLParser(builder).parse(html);
  }

  return post;
}
