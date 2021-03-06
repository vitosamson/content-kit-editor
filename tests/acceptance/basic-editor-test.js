import { Editor } from 'content-kit-editor';
import Helpers from '../test-helpers';

const { test, module } = Helpers;

let fixture, editor, editorElement;

module('Acceptance: editor: basic', {
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

test('sets element as contenteditable', (assert) => {
  editor = new Editor();
  editor.render(editorElement);

  assert.equal(editorElement.getAttribute('contenteditable'),
               'true',
               'element is contenteditable');
});

test('#disableEditing before render is meaningful', (assert) => {
  editor = new Editor();
  editor.disableEditing();
  editor.render(editorElement);

  assert.ok(!editorElement.hasAttribute('contenteditable'),
            'element is not contenteditable');
  editor.enableEditing();
  assert.equal(editorElement.getAttribute('contenteditable'),
               'true',
               'element is contenteditable');
});

test('when editing is disabled, the placeholder is not shown', (assert) => {
  editor = new Editor({placeholder: 'the placeholder'});
  editor.disableEditing();
  editor.render(editorElement);

  assert.ok(!$('#editor').data('placeholder'), 'no placeholder when disabled');
  editor.enableEditing();
  assert.equal($('#editor').data('placeholder'), 'the placeholder',
               'placeholder is shown when editable');
});

test('#disableEditing and #enableEditing toggle contenteditable', (assert) => {
  editor = new Editor();
  editor.render(editorElement);

  assert.equal(editorElement.getAttribute('contenteditable'),
               'true',
               'element is contenteditable');
  editor.disableEditing();
  assert.equal(editorElement.getAttribute('contenteditable'),
               'false',
               'element is not contenteditable');
  editor.enableEditing();
  assert.equal(editorElement.getAttribute('contenteditable'),
               'true',
               'element is contenteditable');
});

test('clicking outside the editor does not raise an error', (assert) => {
  const done = assert.async();
  editor = new Editor({autofocus: false});
  editor.render(editorElement);

  let secondEditorElement = document.createElement('div');
  document.body.appendChild(secondEditorElement);

  let secondEditor = new Editor(); // This editor will be focused
  secondEditor.render(secondEditorElement);

  Helpers.dom.triggerEvent(editorElement, 'click');

  // Embed intent uses setTimeout, so this assertion must
  // setTimeout after it to catch the exception during failure
  // cases.
  setTimeout(() => {
    assert.ok(true, 'can click external item without error');
    secondEditor.destroy();
    document.body.removeChild(secondEditorElement);

    done();
  });
});

test('typing in empty post correctly adds a section to it', (assert) => {
  const mobiledoc = Helpers.mobiledoc.build(({post}) => post());
  editor = new Editor({mobiledoc});
  editor.render(editorElement);

  assert.hasElement('#editor');
  assert.hasNoElement('#editor p');

  Helpers.dom.moveCursorTo($('#editor')[0]);
  Helpers.dom.insertText(editor, 'X');
  assert.hasElement('#editor p:contains(X)');
  Helpers.dom.insertText(editor, 'Y');
  assert.hasElement('#editor p:contains(XY)', 'inserts text at correct spot');
});
