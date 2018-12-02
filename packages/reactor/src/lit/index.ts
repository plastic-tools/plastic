import { SVGTemplateResult, TemplateResult } from "lit-html";
import TemplateProcessor from "./TemplateProcessor";

export { render } from "lit-html";
export * from "./css";

/**
 * Creates an html template with the same semantics as `lit-html`, except
 * that it has built-in support for channels. If you pass a channel as a
 * template value, then the channel will automatically be monitored and
 * the template instance will update anytime the channel value changes.
 */
export const html = (strings: TemplateStringsArray, ...values: any[]) =>
  new TemplateResult(
    strings,
    values,
    "html",
    TemplateProcessor.defaultTempateProcessor
  );

export const svg = (strings: TemplateStringsArray, ...values: any[]) =>
  new SVGTemplateResult(
    strings,
    values,
    "svg",
    TemplateProcessor.defaultTempateProcessor
  );
