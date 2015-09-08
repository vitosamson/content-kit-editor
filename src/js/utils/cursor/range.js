import Position from './position';

export default class Range {
  constructor(head, tail) {
    this.head = head;
    this.tail = tail;
  }

  trimTo(section) {
    const length = section.text.length;

    let headOffset = section === this.head.section ?
      Math.min(this.head.offset, length) : 0;
    let tailOffset = section === this.tail.section ?
      Math.min(this.tail.offset, length) : length;

    return new Range(
      new Position(section, headOffset),
      new Position(section, tailOffset)
    );
  }

  // "legacy" APIs
  get headSection() {
    return this.head.section;
  }
  get tailSection() {
    return this.tail.section;
  }
  get headSectionOffset() {
    return this.head.offset;
  }
  get tailSectionOffset() {
    return this.tail.offset;
  }
  get isCollapsed() {
    return this.head.isEqual(this.tail);
  }
  get headMarker() {
    return this.head.marker;
  }
  get tailMarker() {
    return this.tail.marker;
  }
  get headMarkerOffset() {
    return this.head.offsetInMarker;
  }
  get tailMarkerOffset() {
    return this.tail.offsetInMarker;
  }
}
