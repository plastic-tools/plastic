import { Component, h, RenderableProps } from "@plastic/render";
import User from "../model/user";

export interface HelloWorldProps {
  user: User;
}

export default class HelloWorld extends Component<HelloWorldProps> {
  render() {
    const { fullName = "Unknown" } = this.props.user || {};
    return <h1>Hello {fullName}!</h1>;
  }
}
