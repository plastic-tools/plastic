import { Component, HTMLAttributes, Props, jsx } from "@plastic/render";

export type ButtonProps = HTMLAttributes & {
  title?: string;
  disabled?: boolean;
};

export default class Button extends Component<ButtonProps> {
  render(props: Props<ButtonProps>) {
    const { title, disabled, children, ...attrs } = props;
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
