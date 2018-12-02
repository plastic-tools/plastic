import { isDirective, noChange, NodePart as LitHTMLNodePart } from "lit-html";
import { Channel, isChannel } from "../core";

/** Enhance NodePart to consume channels automatically */
export default class NodePart extends LitHTMLNodePart {
  commit() {
    // process any directives first. super.commit() does this also but we need
    // to do it first to get channels
    while (isDirective(this._pendingValue)) {
      const fn = this._pendingValue;
      this._pendingValue = noChange;
      fn(this);
    }

    if (isChannel(this._pendingValue)) this._commitChannel(this._pendingValue);
    else super.commit();
  }

  async _commitChannel(ch: Channel<any>) {
    // if we've already setup this iterable, we don't need to do anything
    if (ch === this.value) return;

    // next a new part to keep track of previous item values separately from
    // the iterable as a value itself
    const itemPart = new NodePart(this.options);
    this.value = ch;
    let rendered = false;
    for await (const next of ch) {
      // bail when a new value owns this part
      if (this.value !== ch) break;

      // don't clear until first value received. leaves previous display in
      // place until we can replace it
      if (!rendered) {
        rendered = true;
        this.clear();
        itemPart.appendIntoPart(this);
      }

      itemPart.setValue(next);
      itemPart.commit();
    }
  }
}
