import { Editor } from 'content-kit-editor';
import Helpers from '../test-helpers';

const { test, module } = QUnit;

let fixture, editor, editorElement;

module('Acceptance: Editor Deletion', {
  beforeEach() {
    fixture = document.getElementById('qunit-fixture');
    editorElement = document.createElement('div');
    editorElement.setAttribute('id', 'editor');
    fixture.appendChild(editorElement);
  },

  afterEach() {
    if (editor) { editor.destroy(); }
  }
});

test('delete when selection includes letter after a markup', (assert) => {
  const done = assert.async();
  const mobiledoc = Helpers.mobiledoc.build(builder =>
    builder.post([
      builder.markupSection('p', [
        builder.marker('abc'),
        builder.marker('de', [builder.markup('strong')]),
        builder.marker('f')
      ])
    ])
  );
  editor = new Editor({mobiledoc});
  editor.render(editorElement);

  const deText = $('#editor strong:contains(de)')[0].childNodes[0];
  const fText = deText.parentNode.nextSibling;

  assert.equal(deText.textContent, 'de', 'precond - de text node');
  assert.equal(fText.textContent, 'f', 'precond - f text node');

  Helpers.dom.selectText('de', deText, 'f', fText);
  Helpers.dom.triggerMouseup();

  setTimeout(() => {
    Helpers.dom.triggerDelete(editor);

    assert.hasElement('#editor p:contains(abc)',
                      'correct resulting all-text');
    assert.ok($('#editor strong').length === 0, 'no <strong> tag');
    Helpers.dom.insertText('X');

    assert.hasElement('#editor p:contains(abcX)',
                      'new text inserted in right spot');
    done();
  });
});

