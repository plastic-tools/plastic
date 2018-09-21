import { Component, Prop } from "@stencil/core";
import { SitePage } from "../../components/site-page";

import { IGraphData } from "@plastic/d3-stencil";

const GRAPH_DATA: IGraphData = {
  labels: ["<5", "5-13", "14-17", "18-24", "25-44", "45-64", "≥65"],
  pieChartOptions: {
    labelFormat: "ANY" as any,
    dataFormat: "GROUPED_TWO_DIGITS" as any
  },
  styles: {
    width: "100%",
    height: "500px",
    margin: "20px 0"
  },
  colors: [
    "#98abc5",
    "#8a89a6",
    "#7b6888",
    "#6b486b",
    "#a05d56",
    "#d0743c",
    "#ff8c00"
  ],
  data: [[2704659, 4499890, 2159981, 3853788, 16106543, 8819342, 612463]]
};

@Component({
  tag: "home-page"
})
export class HomePage {
  @Prop({ context: "window" })
  win!: Window;

  render() {
    return (
      <SitePage name="Home" current="home-page" win={this.win}>
        <h1>Have some Data, buster</h1>
        <pie-chart graphData={GRAPH_DATA} />
      </SitePage>
    );
  }
}
