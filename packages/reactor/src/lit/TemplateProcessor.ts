import {
  DefaultTemplateProcessor as LitHTMLDefaultTemplateProcessor,
  EventPart,
  PropertyCommitter,
  RenderOptions
} from "lit-html";
import AttributeCommitter from "./AttributeCommitter";
import NodePart from "./NodePart";

/** Return enhanced node part */
export default class TemplateProcessor extends LitHTMLDefaultTemplateProcessor {
  static defaultTempateProcessor = new TemplateProcessor();

  handleAttributeExpressions(
    element: Element,
    name: string,
    strings: string[],
    options: RenderOptions
  ) {
    const prefix = name[0];
    if (prefix === ".") {
      const committer = new PropertyCommitter(element, name.slice(1), strings);
      return committer.parts;
    } else if (prefix === "@") {
      return [new EventPart(element, name.slice(1), options.eventContext)];
    } else if (name.length > 2 && name.indexOf("on") === 0) {
      return [
        new EventPart(
          element,
          name.slice(2).toLowerCase(),
          options.eventContext
        )
      ];
    } else {
      // TODO: can we skip the boolean part?

      const committer = new AttributeCommitter(element, name, strings);
      return committer.parts;
    }
  }

  handleTextExpression(options: RenderOptions) {
    return new NodePart(options);
  }
}
