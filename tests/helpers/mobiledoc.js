import PostAbstractHelpers from './post-abstract';
import MobiledocRenderer from 'content-kit-editor/renderers/mobiledoc';

/*
 * usage:
 *  makeMD(({post, markupSection, marker, markup}) =>
 *    post([
 *      markupSection('P', [
 *        marker('some text', [markup('B')])
 *      ])
 *    })
 *  )
 */
function build(treeFn) {
  return MobiledocRenderer.render(PostAbstractHelpers.build(treeFn));
}

export default {
  build
};
