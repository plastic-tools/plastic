import { ResponderLike } from "./types";

/**
 * Default implementation of the ResponderLike interface.
 */
export class Responder implements ResponderLike {
  sendAction(actionName: string, to: ResponderLike, ...args: any[]) {
    if (!to) to = this;
    return to.performAction(actionName, this, ...args);
  }

  performAction(actionName: string, sender: Object, ...args: any[]) {
    if ("function" === typeof this[actionName]) {
      if (this[actionName](sender, ...args) !== false) return true;
    }
    return this.forwardAction(actionName, sender, ...args);
  }

  forwardAction(actionName: string, sender: Object, ...args: any[]) {
    const { nextResponder } = this;
    return nextResponder
      ? nextResponder.performAction(actionName, sender, ...args)
      : false;
  }

  nextResponder: ResponderLike;
}

export default Responder;
