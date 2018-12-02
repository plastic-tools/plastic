import {
  before,
  flatten,
  html,
  map,
  periodic,
  pipe,
  render,
  repeat,
  state
} from "@plastic/reactor";
import { abortLogin, login, logins } from "./login";

const counter = state(0);
const increment = () => counter.put(n => n + 1);
const decrement = () => counter.put(n => n - 1);

const COLORS = ["black", "red", "blue"];
const style = map(counter, n => `color: ${COLORS[n] || COLORS[0]}`);

const loginStates = pipe(
  logins,
  flatten,
  before(["none"]),
  repeat(1)
);

render(
  html`
    <h1 style="${style}">
      Ticks: ${map(periodic(1000), () => new Date().toLocaleString())}
    </h1>

    <h2>Counter</h2>
    <table>
      <tr>
        <th>Value:</th>
        <td>${counter}</td>
      </tr>
      <tr>
        <td><button onclick="${increment}">+</button></td>
        <td><button onclick="${decrement}">-</button></td>
      </tr>
    </table>

    <h3>Login</h3>
    <table>
      <tr>
        <th>State:</th>
        <td>${map(loginStates, x => JSON.stringify(x))}</td>
      </tr>
      <tr>
        <td>
          <button
            disabled="${map(loginStates, x => x === "pending")}"
            onclick="${login}"
          >
            Login
          </button>
        </td>
        <td><button onclick="${abortLogin}">Abort Login</button></td>
      </tr>
    </table>
  `,
  document.body
);
