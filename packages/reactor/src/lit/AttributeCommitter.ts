import { AttributeCommitter as LitHTMLAttributeCommitter } from "lit-html";
import AttributePart from "./AttributePart";

export default class AttributeCommitter extends LitHTMLAttributeCommitter {
  commit() {
    if (this.dirty) {
      this.dirty = false;
      const value = this._getValue();
      if ("boolean" === typeof value) {
        if (value) this.element.setAttribute(this.name, "");
        else this.element.removeAttribute(this.name);
      } else {
        this.element.setAttribute(this.name, value);
      }
    }
  }

  protected _createPart(): AttributePart {
    return new AttributePart(this);
  }

  /** As long as there is only one part to retrieve, keep original type */
  protected _getValue() {
    const strings = this.strings;
    const part = this.parts[0];
    const ret =
      strings.length === 2 && strings[0] === "" && strings[1] === ""
        ? part
          ? part.value
          : undefined
        : super._getValue();
    return ret;
  }
}
