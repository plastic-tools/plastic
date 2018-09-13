/**
 * @module dom/node
 *
 * Utilities for creating and managing DOM nodes
 */

const SVG_NS = "http://www.w3.org/2000/svg";

/** creates a node with the given name. */
export const createNode = (nodeName: string, isSvg) =>
  isSvg
    ? document.createElementNS(SVG_NS, nodeName)
    : document.createElement(nodeName);

export const createText = (text: string) => document.createTextNode(text);

export const replaceNode = (next: Node, prior: Node) => {
  if (prior.parentNode) prior.parentNode.replaceChild(next, prior);
};

export const removeNode = (node: Node) => {
  const parentNode = node.parentNode;
  if (parentNode) parentNode.removeChild(node);
};

export const isNamed = (node: Node, name: string) => {
  const nodeName = node.nodeName;
  return (
    name === nodeName ||
    ("string" === typeof name &&
      "string" === typeof nodeName &&
      name.toLowerCase() === nodeName.toLowerCase())
  );
};

export const isText = (x: any): x is Text =>
  !!x &&
  "object" === typeof x &&
  "function" === typeof x.splitText &&
  "parentNode" in x;
