import Renderer from "./renderer";
import { RenderCommand } from "./types";

/**
 * Renders the root, optionally using the passed root node as the element
 * it will take over. Returns a Renderer that is also registered to recompute
 * each time the dom tree changes.
 *
 * If you pass a Node as the second parameter, then that will become the new
 * root node the renderer will update or event replace.
 */
export const render = (
  fn: () => RenderCommand,
  root: Node = document && document.body
) => {
  const renderer = new Renderer(fn, null);
  renderer.register(root);
  return renderer;
};
export default render;
