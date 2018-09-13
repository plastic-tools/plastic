import {
  RenderComponent,
  RenderChildren,
  Key,
  Ref,
  DangerouslySetInnerHTML,
  RenderInput
} from "./types";
import * as DOM from "./dom";

// Hook types into JSX.
// https://www.typescriptlang.org/docs/handbook/jsx.html
declare global {
  namespace jsx.JSX {
    // Return value of psx
    type Element = RenderInput;

    // Detect a class component by constructor returning this property
    interface ElementClass {
      output: RenderInput;
    }

    // Detect allowed props on class component
    interface ElementAttributesProperty {
      props: any;
    }

    interface ElementChildrenAttribute {
      children: any;
    }

    interface IntrinsicAttributes {
      key?: Key;
    }

    interface IntrinsicClassAttributes<T = any> {
      ref?: Ref<T>;
    }

    // Allow arbitrary nesting of attributes
    type Child = RenderInput | Children;
    interface Children extends Array<Child> {}

    /** Attributes supported by the `jsx()` helper */
    interface PlasticAttributes {
      children?: Child;
      class?: string;
      dangerouslySetInnerHTML?: DangerouslySetInnerHTML;
      ref?: Ref<any>;
      key?: Key;
    }

    interface HTMLAttributes extends DOM.HTMLAttributes, PlasticAttributes {}
    interface SVGAttributes extends DOM.SVGAttributes, PlasticAttributes {}

    // known intrinsic elements. inherit all dom support
    interface IntrinsicElements {
      // HTML
      a: HTMLAttributes;
      abbr: HTMLAttributes;
      address: HTMLAttributes;
      area: HTMLAttributes;
      article: HTMLAttributes;
      aside: HTMLAttributes;
      audio: HTMLAttributes;
      b: HTMLAttributes;
      base: HTMLAttributes;
      bdi: HTMLAttributes;
      bdo: HTMLAttributes;
      big: HTMLAttributes;
      blockquote: HTMLAttributes;
      body: HTMLAttributes;
      br: HTMLAttributes;
      button: HTMLAttributes;
      canvas: HTMLAttributes;
      caption: HTMLAttributes;
      cite: HTMLAttributes;
      code: HTMLAttributes;
      col: HTMLAttributes;
      colgroup: HTMLAttributes;
      data: HTMLAttributes;
      datalist: HTMLAttributes;
      dd: HTMLAttributes;
      del: HTMLAttributes;
      details: HTMLAttributes;
      dfn: HTMLAttributes;
      dialog: HTMLAttributes;
      div: HTMLAttributes;
      dl: HTMLAttributes;
      dt: HTMLAttributes;
      em: HTMLAttributes;
      embed: HTMLAttributes;
      fieldset: HTMLAttributes;
      figcaption: HTMLAttributes;
      figure: HTMLAttributes;
      footer: HTMLAttributes;
      form: HTMLAttributes;
      h1: HTMLAttributes;
      h2: HTMLAttributes;
      h3: HTMLAttributes;
      h4: HTMLAttributes;
      h5: HTMLAttributes;
      h6: HTMLAttributes;
      head: HTMLAttributes;
      header: HTMLAttributes;
      hr: HTMLAttributes;
      html: HTMLAttributes;
      i: HTMLAttributes;
      iframe: HTMLAttributes;
      img: HTMLAttributes;
      input: HTMLAttributes;
      ins: HTMLAttributes;
      kbd: HTMLAttributes;
      keygen: HTMLAttributes;
      label: HTMLAttributes;
      legend: HTMLAttributes;
      li: HTMLAttributes;
      link: HTMLAttributes;
      main: HTMLAttributes;
      map: HTMLAttributes;
      mark: HTMLAttributes;
      menu: HTMLAttributes;
      menuitem: HTMLAttributes;
      meta: HTMLAttributes;
      meter: HTMLAttributes;
      nav: HTMLAttributes;
      noscript: HTMLAttributes;
      object: HTMLAttributes;
      ol: HTMLAttributes;
      optgroup: HTMLAttributes;
      option: HTMLAttributes;
      output: HTMLAttributes;
      p: HTMLAttributes;
      param: HTMLAttributes;
      picture: HTMLAttributes;
      pre: HTMLAttributes;
      progress: HTMLAttributes;
      q: HTMLAttributes;
      rp: HTMLAttributes;
      rt: HTMLAttributes;
      ruby: HTMLAttributes;
      s: HTMLAttributes;
      samp: HTMLAttributes;
      script: HTMLAttributes;
      section: HTMLAttributes;
      select: HTMLAttributes;
      slot: HTMLAttributes;
      small: HTMLAttributes;
      source: HTMLAttributes;
      span: HTMLAttributes;
      strong: HTMLAttributes;
      style: HTMLAttributes;
      sub: HTMLAttributes;
      summary: HTMLAttributes;
      sup: HTMLAttributes;
      table: HTMLAttributes;
      tbody: HTMLAttributes;
      td: HTMLAttributes;
      textarea: HTMLAttributes;
      tfoot: HTMLAttributes;
      th: HTMLAttributes;
      thead: HTMLAttributes;
      time: HTMLAttributes;
      title: HTMLAttributes;
      tr: HTMLAttributes;
      track: HTMLAttributes;
      u: HTMLAttributes;
      ul: HTMLAttributes;
      var: HTMLAttributes;
      video: HTMLAttributes;
      wbr: HTMLAttributes;

      //SVG
      svg: SVGAttributes;
      animate: SVGAttributes;
      circle: SVGAttributes;
      clipPath: SVGAttributes;
      defs: SVGAttributes;
      ellipse: SVGAttributes;
      feBlend: SVGAttributes;
      feColorMatrix: SVGAttributes;
      feComponentTransfer: SVGAttributes;
      feComposite: SVGAttributes;
      feConvolveMatrix: SVGAttributes;
      feDiffuseLighting: SVGAttributes;
      feDisplacementMap: SVGAttributes;
      feFlood: SVGAttributes;
      feGaussianBlur: SVGAttributes;
      feImage: SVGAttributes;
      feMerge: SVGAttributes;
      feMergeNode: SVGAttributes;
      feMorphology: SVGAttributes;
      feOffset: SVGAttributes;
      feSpecularLighting: SVGAttributes;
      feTile: SVGAttributes;
      feTurbulence: SVGAttributes;
      filter: SVGAttributes;
      foreignObject: SVGAttributes;
      g: SVGAttributes;
      image: SVGAttributes;
      line: SVGAttributes;
      linearGradient: SVGAttributes;
      marker: SVGAttributes;
      mask: SVGAttributes;
      path: SVGAttributes;
      pattern: SVGAttributes;
      polygon: SVGAttributes;
      polyline: SVGAttributes;
      radialGradient: SVGAttributes;
      rect: SVGAttributes;
      stop: SVGAttributes;
      symbol: SVGAttributes;
      text: SVGAttributes;
      tspan: SVGAttributes;
      use: SVGAttributes;
    }
  }
}
