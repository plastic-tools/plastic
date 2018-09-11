/**
 * A responder is a way of relaying events through a chain of objects
 * without having to setup individual event listeners, which can be expensive
 * when you need to configure a large number of them.
 *
 *
 */
interface Responder {
  captureEvent(event: Event): boolean;
  handleEvent(event: Event): boolean;
  performAction(actionName: string, sender: Object, ...args: any[]): boolean;
  forwardAction(actionName: string, sender: Object, ...args: any[]): boolean;
  nextResponder: Responder;
}
