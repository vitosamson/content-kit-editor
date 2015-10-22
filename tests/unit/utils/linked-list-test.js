const {module, test} = QUnit;

import LinkedList from 'content-kit-editor/utils/linked-list';
import LinkedItem from 'content-kit-editor/utils/linked-item';

module('Unit: Utils: LinkedList');

test('initial state', (assert) => {
  let list = new LinkedList();
  assert.equal(list.head, null, 'head is null');
  assert.equal(list.tail, null ,'tail is null');
  assert.equal(list.length, 0, 'length is one');
  assert.equal(list.isEmpty, true, 'isEmpty is true');
});

['append', 'prepend', 'insertBefore', 'insertAfter'].forEach(method => {
  test(`#${method} initial item`, (assert) => {
    let list = new LinkedList();
    let item = new LinkedItem();
    list[method](item);
    assert.equal(list.length, 1, 'length is one');
    assert.equal(list.isEmpty, false, 'isEmpty is false');
    assert.equal(list.head, item, 'head is item');
    assert.equal(list.tail, item, 'tail is item');
    assert.equal(item.next, null, 'item next is null');
    assert.equal(item.prev, null, 'item prev is null');
  });

  test(`#${method} call adoptItem`, (assert) => {
    let adoptedItem;
    let list = new LinkedList({
      adoptItem(item) {
        adoptedItem = item;
      }
    });
    let item = new LinkedItem();
    list[method](item);
    assert.equal(adoptedItem, item, 'item is adopted');
  });
});

test(`#append second item`, (assert) => {
  let list = new LinkedList();
  let itemOne = new LinkedItem();
  let itemTwo = new LinkedItem();
  list.append(itemOne);
  list.append(itemTwo);
  assert.equal(list.length, 2, 'length is two');
  assert.equal(list.head, itemOne, 'head is itemOne');
  assert.equal(list.tail, itemTwo, 'tail is itemTwo');
  assert.equal(itemOne.prev, null, 'itemOne prev is null');
  assert.equal(itemOne.next, itemTwo, 'itemOne next is itemTwo');
  assert.equal(itemTwo.prev, itemOne, 'itemTwo prev is itemOne');
  assert.equal(itemTwo.next, null, 'itemTwo next is null');
});

test(`#prepend first item`, (assert) => {
  let list = new LinkedList();
  let itemOne = new LinkedItem();
  let itemTwo = new LinkedItem();
  list.prepend(itemTwo);
  list.prepend(itemOne);
  assert.equal(list.length, 2, 'length is two');
  assert.equal(list.head, itemOne, 'head is itemOne');
  assert.equal(list.tail, itemTwo, 'tail is itemTwo');
  assert.equal(itemOne.prev, null, 'itemOne prev is null');
  assert.equal(itemOne.next, itemTwo, 'itemOne next is itemTwo');
  assert.equal(itemTwo.prev, itemOne, 'itemTwo prev is itemOne');
  assert.equal(itemTwo.next, null, 'itemTwo next is null');
});

test(`#insertBefore a middle item`, (assert) => {
  let list = new LinkedList();
  let itemOne = new LinkedItem();
  let itemTwo = new LinkedItem();
  let itemThree = new LinkedItem();
  list.prepend(itemOne);
  list.append(itemThree);
  list.insertBefore(itemTwo, itemThree);
  assert.equal(list.length, 3, 'length is three');
  assert.equal(list.head, itemOne, 'head is itemOne');
  assert.equal(list.tail, itemThree, 'tail is itemThree');
  assert.equal(itemOne.prev, null, 'itemOne prev is null');
  assert.equal(itemOne.next, itemTwo, 'itemOne next is itemTwo');
  assert.equal(itemTwo.prev, itemOne, 'itemTwo prev is itemOne');
  assert.equal(itemTwo.next, itemThree, 'itemTwo next is itemThree');
  assert.equal(itemThree.prev, itemTwo, 'itemThree prev is itemTwo');
  assert.equal(itemThree.next, null, 'itemThree next is null');
});

test(`#insertAfter a middle item`, (assert) => {
  let list = new LinkedList();
  let itemOne = new LinkedItem();
  let itemTwo = new LinkedItem();
  let itemThree = new LinkedItem();
  list.prepend(itemOne);
  list.append(itemThree);
  list.insertAfter(itemTwo, itemOne);
  assert.equal(list.head, itemOne, 'head is itemOne');
  assert.equal(list.tail, itemThree, 'tail is itemThree');
  assert.equal(itemOne.prev, null, 'itemOne prev is null');
  assert.equal(itemOne.next, itemTwo, 'itemOne next is itemTwo');
  assert.equal(itemTwo.prev, itemOne, 'itemTwo prev is itemOne');
  assert.equal(itemTwo.next, itemThree, 'itemTwo next is itemThree');
  assert.equal(itemThree.prev, itemTwo, 'itemThree prev is itemTwo');
  assert.equal(itemThree.next, null, 'itemThree next is null');
});

test('#insertAfter null reference item prepends the item', (assert) => {
  let list = new LinkedList();
  let item1 = new LinkedItem();
  let item2 = new LinkedItem();
  list.append(item1);
  list.insertAfter(item2, null);

  assert.equal(list.head, item2, 'item2 is appended');
  assert.equal(list.tail, item1, 'item1 is at tail');
});

test('#insertBefore null reference item appends the item', (assert) => {
  let list = new LinkedList();
  let item1 = new LinkedItem();
  let item2 = new LinkedItem();
  list.append(item1);
  list.insertBefore(item2, null);

  assert.equal(list.tail, item2, 'item2 is appended');
  assert.equal(list.head, item1, 'item1 is at head');
});

test(`#remove an only item`, (assert) => {
  let list = new LinkedList();
  let item = new LinkedItem();
  list.append(item);
  list.remove(item);
  assert.equal(list.length, 0, 'length is zero');
  assert.equal(list.isEmpty, true, 'isEmpty is true');
  assert.equal(list.head, null, 'head is null');
  assert.equal(list.tail, null, 'tail is null');
  assert.equal(item.prev, null, 'item prev is null');
  assert.equal(item.next, null, 'item next is null');
});

test(`#remove calls freeItem`, (assert) => {
  let freedItem;
  let list = new LinkedList({
    freeItem(item) {
      freedItem = item;
    }
  });
  let item = new LinkedItem();
  list.append(item);
  list.remove(item);
  assert.equal(freedItem, item, 'item is freed');
});

test(`#remove a first item`, (assert) => {
  let list = new LinkedList();
  let itemOne = new LinkedItem();
  let itemTwo = new LinkedItem();
  list.append(itemOne);
  list.append(itemTwo);
  list.remove(itemOne);
  assert.equal(list.length, 1, 'length is one');
  assert.equal(list.head, itemTwo, 'head is itemTwo');
  assert.equal(list.tail, itemTwo, 'tail is itemTwo');
  assert.equal(itemOne.prev, null, 'itemOne prev is null');
  assert.equal(itemOne.next, null, 'itemOne next is null');
  assert.equal(itemTwo.prev, null, 'itemTwo prev is null');
  assert.equal(itemTwo.next, null, 'itemTwo next is null');
});

test(`#remove a second item`, (assert) => {
  let list = new LinkedList();
  let itemOne = new LinkedItem();
  let itemTwo = new LinkedItem();
  list.append(itemOne);
  list.append(itemTwo);
  list.remove(itemTwo);
  assert.equal(list.head, itemOne, 'head is itemOne');
  assert.equal(list.tail, itemOne, 'tail is itemOne');
  assert.equal(itemOne.prev, null, 'itemOne prev is null');
  assert.equal(itemOne.next, null, 'itemOne next is null');
  assert.equal(itemTwo.prev, null, 'itemTwo prev is null');
  assert.equal(itemTwo.next, null, 'itemTwo next is null');
});

test(`#remove a middle item`, (assert) => {
  let list = new LinkedList();
  let itemOne = new LinkedItem();
  let itemTwo = new LinkedItem();
  let itemThree = new LinkedItem();
  list.append(itemOne);
  list.append(itemTwo);
  list.append(itemThree);
  list.remove(itemTwo);
  assert.equal(list.head, itemOne, 'head is itemOne');
  assert.equal(list.tail, itemThree, 'tail is itemThree');
  assert.equal(itemOne.prev, null, 'itemOne prev is null');
  assert.equal(itemOne.next, itemThree, 'itemOne next is itemThree');
  assert.equal(itemTwo.prev, null, 'itemTwo prev is null');
  assert.equal(itemTwo.next, null, 'itemTwo next is null');
  assert.equal(itemThree.prev, itemOne, 'itemThree prev is itemOne');
  assert.equal(itemThree.next, null, 'itemThree next is null');
});

test(`#forEach iterates many`, (assert) => {
  let list = new LinkedList();
  let itemOne = new LinkedItem();
  let itemTwo = new LinkedItem();
  let itemThree = new LinkedItem();
  list.append(itemOne);
  list.append(itemTwo);
  list.append(itemThree);
  let items = [];
  let indexes = [];
  list.forEach((item, index) => {
    items.push(item);
    indexes.push(index);
  });
  assert.deepEqual(items, [itemOne, itemTwo, itemThree], 'items correct');
  assert.deepEqual(indexes, [0, 1, 2], 'indexes correct');
});

test(`#forEach iterates one`, (assert) => {
  let list = new LinkedList();
  let itemOne = new LinkedItem();
  list.append(itemOne);
  let items = [];
  let indexes = [];
  list.forEach((item, index) => {
    items.push(item);
    indexes.push(index);
  });
  assert.deepEqual(items, [itemOne], 'items correct');
  assert.deepEqual(indexes, [0], 'indexes correct');
});

test(`#readRange walks from start to end`, (assert) => {
  let list = new LinkedList();
  let itemOne = new LinkedItem();
  let itemTwo = new LinkedItem();
  let itemThree = new LinkedItem();
  list.append(itemOne);
  list.append(itemTwo);
  list.append(itemThree);
  let items = [];
  let indexes = [];
  list.forEach((item, index) => {
    items.push(item);
    indexes.push(index);
  });
  assert.deepEqual(list.readRange(itemOne, itemOne), [itemOne], 'items correct');
  assert.deepEqual(list.readRange(itemTwo, itemThree), [itemTwo, itemThree], 'items correct');
  assert.deepEqual(list.readRange(itemOne, itemTwo), [itemOne, itemTwo], 'items correct');
  assert.deepEqual(list.readRange(itemOne, null), [itemOne, itemTwo, itemThree], 'items correct');
});

test(`#toArray builds array`, (assert) => {
  let list = new LinkedList();
  let itemOne = new LinkedItem();
  list.append(itemOne);
  assert.deepEqual(list.toArray(), [itemOne], 'items correct');
});

test(`#toArray builds many array`, (assert) => {
  let list = new LinkedList();
  let itemOne = new LinkedItem();
  let itemTwo = new LinkedItem();
  let itemThree = new LinkedItem();
  list.append(itemOne);
  list.append(itemTwo);
  list.append(itemThree);
  assert.deepEqual(list.toArray(), [itemOne, itemTwo, itemThree], 'items correct');
});

test(`#detect finds`, (assert) => {
  let list = new LinkedList();
  let itemOne = new LinkedItem();
  let itemTwo = new LinkedItem();
  let itemThree = new LinkedItem();
  list.append(itemOne);
  list.append(itemTwo);
  list.append(itemThree);
  assert.equal(list.detect(item => item === itemOne), itemOne, 'itemOne detected');
  assert.equal(list.detect(item => item === itemTwo), itemTwo, 'itemTwo detected');
  assert.equal(list.detect(item => item === itemThree), itemThree, 'itemThree detected');
  assert.equal(list.detect(() => false), undefined, 'no item detected');
});

test(`#objectAt looks up by index`, (assert) => {
  let list = new LinkedList();
  let itemOne = new LinkedItem();
  list.append(itemOne);
  assert.equal(list.objectAt(0), itemOne, 'itemOne looked up');

  let itemTwo = new LinkedItem();
  let itemThree = new LinkedItem();
  list.append(itemTwo);
  list.append(itemThree);
  assert.equal(list.objectAt(0), itemOne, 'itemOne looked up');
  assert.equal(list.objectAt(1), itemTwo, 'itemTwo looked up');
  assert.equal(list.objectAt(2), itemThree, 'itemThree looked up');
});

test(`#splice removes a target and inserts an array of items`, (assert) => {
  let list = new LinkedList();
  let itemOne = new LinkedItem();
  let itemTwo = new LinkedItem();
  let itemThree = new LinkedItem();
  list.append(itemOne);
  list.append(itemThree);

  list.splice(itemOne, 1, [itemTwo]);

  assert.equal(list.head, itemTwo, 'itemOne is head');
  assert.equal(list.objectAt(1), itemThree, 'itemThree is present');
});

test(`#splice remove nothing and inserts an array of nothing`, (assert) => {
  let list = new LinkedList();
  let itemOne = new LinkedItem();
  let itemTwo = new LinkedItem();
  list.append(itemOne);
  list.append(itemTwo);

  list.splice(itemTwo, 0, []);

  assert.equal(list.head, itemOne, 'itemOne is head');
  assert.equal(list.objectAt(1), itemTwo, 'itemTwo is present');
});

test(`#splice can reorganize items`, (assert) => {
  let list = new LinkedList();
  let itemOne = new LinkedItem();
  let itemTwo = new LinkedItem();
  let itemThree = new LinkedItem();
  list.append(itemOne);
  list.append(itemTwo);
  list.append(itemThree);

  list.splice(itemOne, 3, [itemThree, itemOne, itemTwo]);

  assert.equal(list.head, itemThree, 'itemThree is head');
  assert.equal(list.objectAt(1), itemOne, 'itemOne is present');
  assert.equal(list.objectAt(2), itemTwo, 'itemTwo is present');
});

test(`#removeBy mutates list when item is in middle`, (assert) => {
  let list = new LinkedList();
  let items = [
    new LinkedItem(),
    new LinkedItem(),
    new LinkedItem(),
    new LinkedItem()
  ];
  items[1].shouldRemove = true;
  items.forEach(i => list.append(i));

  assert.equal(list.length, 4);
  list.removeBy(i => i.shouldRemove);
  assert.equal(list.length, 3);
  assert.equal(list.head, items[0]);
  assert.equal(list.objectAt(1), items[2]);
  assert.equal(list.objectAt(2), items[3]);
  assert.equal(list.tail, items[3]);
});

test(`#removeBy mutates list when item is first`, (assert) => {
  let list = new LinkedList();
  let items = [
    new LinkedItem(),
    new LinkedItem(),
    new LinkedItem(),
    new LinkedItem()
  ];
  items[0].shouldRemove = true;
  items.forEach(i => list.append(i));

  assert.equal(list.length, 4);
  list.removeBy(i => i.shouldRemove);
  assert.equal(list.length, 3);
  assert.equal(list.head, items[1]);
  assert.equal(list.objectAt(1), items[2]);
  assert.equal(list.tail, items[3]);
});

test(`#removeBy mutates list when item is last`, (assert) => {
  let list = new LinkedList();
  let items = [
    new LinkedItem(),
    new LinkedItem(),
    new LinkedItem(),
    new LinkedItem()
  ];
  items[3].shouldRemove = true;
  items.forEach(i => list.append(i));

  assert.equal(list.length, 4);
  list.removeBy(i => i.shouldRemove);
  assert.equal(list.length, 3);
  assert.equal(list.head, items[0]);
  assert.equal(list.objectAt(1), items[1]);
  assert.equal(list.tail, items[2]);
});

test('#removeBy calls `freeItem` for each item removed', (assert) => {
  let freed = [];

  let list = new LinkedList({
    freeItem(item) {
      freed.push(item);
    }
  });

  let items = [
    new LinkedItem(),
    new LinkedItem(),
    new LinkedItem()
  ];
  items[0].name = '0';
  items[1].name = '1';
  items[2].name = '2';

  items[0].shouldRemove = true;
  items[1].shouldRemove = true;

  items.forEach(i => list.append(i));

  list.removeBy(i => i.shouldRemove);

  assert.deepEqual(freed, [items[0], items[1]]);
});

test('#insertBefore throws if item to be inserted is already in this list', (assert) => {
  let item1 = new LinkedItem();
  let list1 = new LinkedList();
  list1.append(item1);

  assert.throws(() => {
    list1.insertBefore(item1, null);
  });
});

test('#insertBefore throws if item to be inserted is in another non-empty list', (assert) => {
  let item1 = new LinkedItem();
  let item2 = new LinkedItem();
  let list1 = new LinkedList();
  list1.append(item1);
  list1.append(item2);

  let list2 = new LinkedList();

  assert.throws(() => {
    list2.insertBefore(item1, null);
  });
});

test('#every', (assert) => {
  let list = new LinkedList();
  [2,3,4].forEach(n => list.append({val: n}));

  assert.ok(list.every(i => i.val > 0), '> 0');
  assert.ok(!list.every(i => i.val % 2 === 0), 'even');
});
