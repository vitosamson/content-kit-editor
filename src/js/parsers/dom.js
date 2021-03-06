import { NO_BREAK_SPACE } from '../renderers/editor-dom';
import {
  MARKUP_SECTION_TYPE,
  LIST_SECTION_TYPE,
  LIST_ITEM_TYPE
} from '../models/types';
import {
  isTextNode,
  normalizeTagName
} from '../utils/dom-utils';
import {
  detect,
  forEach,
} from '../utils/array-utils';

import SectionParser from 'content-kit-editor/parsers/section';
import { getAttributes, walkTextNodes } from '../utils/dom-utils';
import Markup from 'content-kit-editor/models/markup';

const GOOGLE_DOCS_CONTAINER_ID_REGEX = /^docs\-internal\-guid/;

const NO_BREAK_SPACE_REGEX = new RegExp(NO_BREAK_SPACE, 'g');
export function transformHTMLText(textContent) {
  let text = textContent;
  text = text.replace(NO_BREAK_SPACE_REGEX, ' ');
  return text;
}

function isGoogleDocsContainer(element) {
  return !isTextNode(element) &&
         normalizeTagName(element.tagName) === normalizeTagName('b') &&
         GOOGLE_DOCS_CONTAINER_ID_REGEX.test(element.id);
}

function detectRootElement(element) {
  let childNodes = element.childNodes || [];
  let googleDocsContainer = detect(childNodes, isGoogleDocsContainer);

  if (googleDocsContainer) {
    return googleDocsContainer;
  } else {
    return element;
  }
}

const TAG_REMAPPING = {
  'b': 'strong',
  'i': 'em'
};

function remapTagName(tagName) {
  let normalized = normalizeTagName(tagName);
  let remapped = TAG_REMAPPING[normalized];
  return remapped || normalized;
}

/**
 * Parses DOM element -> Post
 */
export default class DOMParser {
  constructor(builder, options={}) {
    this.builder = builder;
    this.sectionParser = new SectionParser(this.builder, options);
  }

  parse(element) {
    const post = this.builder.createPost();
    let rootElement = detectRootElement(element);

    this._eachChildNode(rootElement, child => {
      let sections = this.parseSections(child);
      this.appendSections(post, sections);
    });

    return post;
  }

  appendSections(post, sections) {
    forEach(sections, section => this.appendSection(post, section));
  }

  appendSection(post, section) {
    if (section.isBlank) {
      return;
    }

    let lastSection = post.sections.tail;
    if (lastSection &&
        lastSection._inferredTagName &&
        section._inferredTagName &&
        lastSection.tagName === section.tagName) {
      lastSection.join(section);
    } else {
      post.sections.append(section);
    }
  }

  _eachChildNode(element, callback) {
    let nodes = isTextNode(element) ? [element] : element.childNodes;
    forEach(nodes, node => callback(node));
  }

  parseSections(element) {
    return this.sectionParser.parse(element);
  }

  // walk up from the textNode until the rootNode, converting each
  // parentNode into a markup
  collectMarkups(textNode, rootNode) {
    let markups = [];
    let currentNode = textNode.parentNode;
    while (currentNode && currentNode !== rootNode) {
      let markup = this.markupFromNode(currentNode);
      if (markup) {
        markups.push(markup);
      }

      currentNode = currentNode.parentNode;
    }
    return markups;
  }

  // Turn an element node into a markup
  markupFromNode(node) {
    if (Markup.isValidElement(node)) {
      let tagName = remapTagName(node.tagName);
      let attributes = getAttributes(node);
      return this.builder.createMarkup(tagName, attributes);
    }
  }

  // FIXME should move to the section parser?
  // FIXME the `collectMarkups` logic could simplify the section parser?
  reparseSection(section, renderTree) {
    switch (section.type) {
      case LIST_SECTION_TYPE:
        return this.reparseListSection(section, renderTree);
      case LIST_ITEM_TYPE:
        return this.reparseListItem(section, renderTree);
      case MARKUP_SECTION_TYPE:
        return this.reparseMarkupSection(section, renderTree);
      default:
        return; // can only parse the above types
    }
  }

  reparseMarkupSection(section, renderTree) {
    return this._reparseSectionContainingMarkers(section, renderTree);
  }

  reparseListItem(listItem, renderTree) {
    return this._reparseSectionContainingMarkers(listItem, renderTree);
  }

  reparseListSection(listSection, renderTree) {
    listSection.items.forEach(li => this.reparseListItem(li, renderTree));
  }

  _reparseSectionContainingMarkers(section, renderTree) {
    const element = section.renderNode.element;
    let seenRenderNodes = [];
    let previousMarker;

    walkTextNodes(element, (textNode) => {
      const text = transformHTMLText(textNode.textContent);
      let markups = this.collectMarkups(textNode, element);

      let marker;

      let renderNode = renderTree.getElementRenderNode(textNode);
      if (renderNode) {
        if (text.length) {
          marker = renderNode.postNode;
          marker.value = text;
          marker.markups = markups;
        } else {
          renderNode.scheduleForRemoval();
        }
      } else {
        marker = this.builder.createMarker(text, markups);

        renderNode = renderTree.buildRenderNode(marker);
        renderNode.element = textNode;
        renderNode.markClean();

        let previousRenderNode = previousMarker && previousMarker.renderNode;
        section.markers.insertAfter(marker, previousMarker);
        section.renderNode.childNodes.insertAfter(renderNode, previousRenderNode);

        let parentNodeCount = marker.closedMarkups.length;
        let nextMarkerElement = textNode.parentNode;
        while (parentNodeCount--) {
          nextMarkerElement = nextMarkerElement.parentNode;
        }
        renderNode.nextMarkerElement = nextMarkerElement;
      }

      seenRenderNodes.push(renderNode);
      previousMarker = marker;
    });

    let renderNode = section.renderNode.childNodes.head;
    while (renderNode) {
      if (seenRenderNodes.indexOf(renderNode) === -1) {
        renderNode.scheduleForRemoval();
      }
      renderNode = renderNode.next;
    }
  }
}
