import Ember from 'ember';

export default Ember.Controller.extend({
  actions: {
    didEdit(mobiledocName, mobiledocValue) {
      this.set(mobiledocName, mobiledocValue);
    },
    loadEditor(editorName, editor) {
      this.set(editorName, editor);
    },
    mergeMobiledocs() {
      let e1 = this.get('editor1'),
          e2 = this.get('editor2');

      Ember.assert('You must click both load buttons before merging',
                   !!e1 && !!e2);

      let p1 = e1.post,
          p2 = e2.post;

      let position = {
        section: p1.sections.tail,
        offset: p1.sections.tail.length
      };
      e1.run(postEditor => {
        postEditor.insertPost(position, p2);
      });
    }
  }
});
