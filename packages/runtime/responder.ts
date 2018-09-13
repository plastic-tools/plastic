export interface ResponderLike {
  /**
   * Attempts to perform the named action by invoking a similarly named
   * method on the receiver. The default implementation
   */
  performAction(actionName: string, sender: Object, ...args: any[]): boolean;

  /**
   * If implemented, should be called by performAction() if it cannot find a
   * local method to call. Should look for any follow on responder to call
   * instead.
   *
   * @param actionName
   * @param sender
   * @param args
   */
  forwardAction?(actionName: string, sender: Object, ...args: any[]): boolean;

  /**
   * If implemented, should point to the next responder to forward events
   * to.
   */
  nextResponder?: ResponderLike;
}
export const isResponderLike = (x: any) =>
  !!x && "object" === typeof x && "function" === typeof x.performAction;

/** Default implementation of the ResponderLike interface. */
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
