import { Component, HTMLAttributes, Props, jsx } from "@plastic/render";

export type ButtonProps = HTMLAttributes & {
  title?: string;
  disabled?: boolean;
};

export interface ButtonEvents {
  onTap(sender: Button, event: Event): boolean | void;
}

export default class Button extends Component<ButtonProps> {
  render() {
    const { title, disabled, children, ...attrs } = this.props;
    return (
      <button disabled={disabled} {...attrs}>
        {children && children.length > 0 ? children : title}
      </button>
    );
  }
}

export const ButtonFn = ({
  title,
  disabled,
  children,
  className,
  ...attrs
}: Props<ButtonProps>) => (
  <button disabled={disabled} {...attrs} class={className}>
    {children && children.length > 0 ? children : title}
  </button>
);

const buttonTest = <ButtonFn title="Hello" />;
