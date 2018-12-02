import { AttributePart as LitHTMLAttributePart, noChange } from "lit-html";
import { Channel, isChannel, nothing } from "../core";

export default class AttributePart extends LitHTMLAttributePart {
  _channel?: Channel;
  setValue(value: any): void {
    if (value === nothing) value = noChange;
    if (isChannel(value)) {
      this._channel = value;
      this._setChannel(value);
      value = noChange;
    } else {
      this._channel = undefined; // stops tracking
    }
    super.setValue(value);
  }

  private _setValueFromChannel(value: any) {
    super.setValue(value);
    this.committer.commit();
  }

  private async _setChannel(ch: Channel<any>) {
    for await (const next of ch) {
      // this channel no longer owns the attribute
      if (this._channel !== ch) break;
      this._setValueFromChannel(next);
    }
  }
}
