/**
* This is an autogenerated file created by the Stencil compiler.
* It contains typing information for all components that exist in this project.
*/
/* tslint:disable */

import '@stencil/core';


import {
  IGraphData,
  LegendData,
} from './interfaces';


export namespace Components {

  interface MyApp {}
  interface MyAppAttributes extends StencilHTMLAttributes {}

  interface BcgMatrixChart {
    'graphData': IGraphData;
    'updateGraphData': (graphData: IGraphData) => void;
  }
  interface BcgMatrixChartAttributes extends StencilHTMLAttributes {
    'graphData'?: IGraphData;
  }

  interface HorizontalBarChart {
    'graphData': IGraphData;
    'updateGraphData': (graphData: IGraphData) => void;
  }
  interface HorizontalBarChartAttributes extends StencilHTMLAttributes {
    'graphData'?: IGraphData;
  }

  interface LegendChart {
    'callOnClick': (callOnClickChild: any) => void;
    'legendData': LegendData;
  }
  interface LegendChartAttributes extends StencilHTMLAttributes {
    'legendData'?: LegendData;
  }

  interface LineAnnotationsChart {
    'graphData': IGraphData;
    'updateGraphData': (graphData: IGraphData) => void;
  }
  interface LineAnnotationsChartAttributes extends StencilHTMLAttributes {
    'graphData'?: IGraphData;
  }

  interface LineChart {
    'graphData': IGraphData;
    'updateGraphData': (graphData: IGraphData) => void;
  }
  interface LineChartAttributes extends StencilHTMLAttributes {
    'graphData'?: IGraphData;
    'onLineChartRendered'?: (event: CustomEvent) => void;
  }

  interface PieChart {
    'graphData': IGraphData;
    'updateGraphData': (graphData: IGraphData) => void;
  }
  interface PieChartAttributes extends StencilHTMLAttributes {
    'graphData'?: IGraphData;
  }

  interface TooltipChart {
    'align': string;
    'hide': () => void;
    'show': (message: string, positions: number[]) => void;
    'tooltip': (tooltip: any) => void;
  }
  interface TooltipChartAttributes extends StencilHTMLAttributes {
    'align'?: string;
  }
}

declare global {
  interface StencilElementInterfaces {
    'MyApp': Components.MyApp;
    'BcgMatrixChart': Components.BcgMatrixChart;
    'HorizontalBarChart': Components.HorizontalBarChart;
    'LegendChart': Components.LegendChart;
    'LineAnnotationsChart': Components.LineAnnotationsChart;
    'LineChart': Components.LineChart;
    'PieChart': Components.PieChart;
    'TooltipChart': Components.TooltipChart;
  }

  interface StencilIntrinsicElements {
    'my-app': Components.MyAppAttributes;
    'bcg-matrix-chart': Components.BcgMatrixChartAttributes;
    'horizontal-bar-chart': Components.HorizontalBarChartAttributes;
    'legend-chart': Components.LegendChartAttributes;
    'line-annotations-chart': Components.LineAnnotationsChartAttributes;
    'line-chart': Components.LineChartAttributes;
    'pie-chart': Components.PieChartAttributes;
    'tooltip-chart': Components.TooltipChartAttributes;
  }


  interface HTMLMyAppElement extends Components.MyApp, HTMLStencilElement {}
  var HTMLMyAppElement: {
    prototype: HTMLMyAppElement;
    new (): HTMLMyAppElement;
  };

  interface HTMLBcgMatrixChartElement extends Components.BcgMatrixChart, HTMLStencilElement {}
  var HTMLBcgMatrixChartElement: {
    prototype: HTMLBcgMatrixChartElement;
    new (): HTMLBcgMatrixChartElement;
  };

  interface HTMLHorizontalBarChartElement extends Components.HorizontalBarChart, HTMLStencilElement {}
  var HTMLHorizontalBarChartElement: {
    prototype: HTMLHorizontalBarChartElement;
    new (): HTMLHorizontalBarChartElement;
  };

  interface HTMLLegendChartElement extends Components.LegendChart, HTMLStencilElement {}
  var HTMLLegendChartElement: {
    prototype: HTMLLegendChartElement;
    new (): HTMLLegendChartElement;
  };

  interface HTMLLineAnnotationsChartElement extends Components.LineAnnotationsChart, HTMLStencilElement {}
  var HTMLLineAnnotationsChartElement: {
    prototype: HTMLLineAnnotationsChartElement;
    new (): HTMLLineAnnotationsChartElement;
  };

  interface HTMLLineChartElement extends Components.LineChart, HTMLStencilElement {}
  var HTMLLineChartElement: {
    prototype: HTMLLineChartElement;
    new (): HTMLLineChartElement;
  };

  interface HTMLPieChartElement extends Components.PieChart, HTMLStencilElement {}
  var HTMLPieChartElement: {
    prototype: HTMLPieChartElement;
    new (): HTMLPieChartElement;
  };

  interface HTMLTooltipChartElement extends Components.TooltipChart, HTMLStencilElement {}
  var HTMLTooltipChartElement: {
    prototype: HTMLTooltipChartElement;
    new (): HTMLTooltipChartElement;
  };

  interface HTMLElementTagNameMap {
    'my-app': HTMLMyAppElement
    'bcg-matrix-chart': HTMLBcgMatrixChartElement
    'horizontal-bar-chart': HTMLHorizontalBarChartElement
    'legend-chart': HTMLLegendChartElement
    'line-annotations-chart': HTMLLineAnnotationsChartElement
    'line-chart': HTMLLineChartElement
    'pie-chart': HTMLPieChartElement
    'tooltip-chart': HTMLTooltipChartElement
  }

  interface ElementTagNameMap {
    'my-app': HTMLMyAppElement;
    'bcg-matrix-chart': HTMLBcgMatrixChartElement;
    'horizontal-bar-chart': HTMLHorizontalBarChartElement;
    'legend-chart': HTMLLegendChartElement;
    'line-annotations-chart': HTMLLineAnnotationsChartElement;
    'line-chart': HTMLLineChartElement;
    'pie-chart': HTMLPieChartElement;
    'tooltip-chart': HTMLTooltipChartElement;
  }


  export namespace JSX {
    export interface Element {}
    export interface IntrinsicElements extends StencilIntrinsicElements {
      [tagName: string]: any;
    }
  }
  export interface HTMLAttributes extends StencilHTMLAttributes {}

}
