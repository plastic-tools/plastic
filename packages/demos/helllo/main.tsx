import { render, h } from "@plastic/render";
import HelloWorld from "@plastic/demos/helllo/components/hello-world";
import User from "./model/user";

const renderer = render(() => <HelloWorld user={User.currentUser} />);
