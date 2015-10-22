import { normalizeTagName } from '../utils/dom-utils';
import { MARKUP_TYPE } from './types';
import assert from '../utils/assert';

export const VALID_MARKUP_TAGNAMES = [
  'b',
  'i',
  'strong',
  'em',
  'a',
  'li'
].map(normalizeTagName);

export const VALID_ATTRIBUTES = [
  'href',
  'ref'
];

class Markup {
  /*
   * @param {Object} attributes key-values
   */
  constructor(tagName, attributes={}) {
    this.tagName = normalizeTagName(tagName);

    assert('Must use attributes object param (not array) for Markup',
           !Array.isArray(attributes));

    this.attributes = attributes;
    this.type = MARKUP_TYPE;

    assert(`Cannot create markup of tagName ${tagName}`,
           VALID_MARKUP_TAGNAMES.indexOf(this.tagName) !== -1);
  }

  hasTag(tagName) {
    return this.tagName === normalizeTagName(tagName);
  }

  getAttribute(name) {
    return this.attributes[name];
  }

  static isValidElement(element) {
    const tagName = normalizeTagName(element.tagName);
    return VALID_MARKUP_TAGNAMES.indexOf(tagName) !== -1;
  }
}

export default Markup;
