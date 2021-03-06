import {
  MOBILEDOC_MARKUP_SECTION_TYPE,
  MOBILEDOC_IMAGE_SECTION_TYPE,
  MOBILEDOC_LIST_SECTION_TYPE,
  MOBILEDOC_CARD_SECTION_TYPE
} from '../renderers/mobiledoc';
import { kvArrayToObject, filter } from "../utils/array-utils";

/*
 * Parses from mobiledoc -> post
 */
export default class MobiledocParser {
  constructor(builder) {
    this.builder = builder;
  }

  /**
   * @method parse
   * @param {Mobiledoc}
   * @return {Post}
   */
  parse({version, sections: sectionData}) {
    try {
      const markerTypes = sectionData[0];
      const sections    = sectionData[1];

      const post = this.builder.createPost();

      this.markups = [];
      this.markerTypes = this.parseMarkerTypes(markerTypes);
      this.parseSections(sections, post);

      return post;
    } catch (e) {
      throw new Error(`Unable to parse mobiledoc: ${e.message}`);
    }
  }

  parseMarkerTypes(markerTypes) {
    return markerTypes.map((markerType) => this.parseMarkerType(markerType));
  }

  parseMarkerType([tagName, attributesArray]) {
    const attributesObject = kvArrayToObject(attributesArray || []);
    return this.builder.createMarkup(tagName, attributesObject);
  }

  parseSections(sections, post) {
    sections.forEach((section) => this.parseSection(section, post));
  }

  parseSection(section, post) {
    let [type] = section;
    switch(type) {
      case MOBILEDOC_MARKUP_SECTION_TYPE:
        this.parseMarkupSection(section, post);
        break;
      case MOBILEDOC_IMAGE_SECTION_TYPE:
        this.parseImageSection(section, post);
        break;
      case MOBILEDOC_CARD_SECTION_TYPE:
        this.parseCardSection(section, post);
        break;
      case MOBILEDOC_LIST_SECTION_TYPE:
        this.parseListSection(section, post);
        break;
      default:
        throw new Error(`Unexpected section type ${type}`);
    }
  }

  parseCardSection([type, name, payload], post) {
    const section = this.builder.createCardSection(name, payload);
    post.sections.append(section);
  }

  parseImageSection([type, src], post) {
    const section = this.builder.createImageSection(src);
    post.sections.append(section);
  }

  parseMarkupSection([type, tagName, markers], post) {
    const section = this.builder.createMarkupSection(tagName);
    post.sections.append(section);
    this.parseMarkers(markers, section);
    // Strip blank markers after the have been created. This ensures any
    // markup they include has been correctly populated.
    filter(section.markers, m => m.isEmpty).forEach(m => {
      section.markers.remove(m);
    });
  }

  parseListSection([type, tagName, items], post) {
    const section = this.builder.createListSection(tagName);
    post.sections.append(section);
    this.parseListItems(items, section);
  }

  parseListItems(items, section) {
    items.forEach(i => this.parseListItem(i, section));
  }

  parseListItem(markers, section) {
    const item = this.builder.createListItem();
    this.parseMarkers(markers, item);
    section.items.append(item);
  }

  parseMarkers(markers, parent) {
    markers.forEach(m => this.parseMarker(m, parent));
  }

  parseMarker([markerTypeIndexes, closeCount, value], parent) {
    markerTypeIndexes.forEach(index => {
      this.markups.push(this.markerTypes[index]);
    });
    const marker = this.builder.createMarker(value, this.markups.slice());
    parent.markers.append(marker);
    this.markups = this.markups.slice(0, this.markups.length-closeCount);
  }
}
