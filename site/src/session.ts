import { Channel, state } from "@plastic/reactor";
import { sleep } from "@plastic/utils";

const ANONYMOUS_UID = "(anonymous)";

export interface Session {
  /**
   * Current session state
   *
   * | value | meaning |
   * | ----- | ------- |
   * | `authenticated` | user is known and authenticated this session |
   * | `unauthenticated` | user is known but not recently verified |
   * | `anonymous` | user not known |
   */
  state: "authenticated" | "unauthenticated" | "anonymous";

  // set to indiciate used. set to ANONYMOUS_UID if user is unknown
  uid: string;

  // display name of the user
  displayName: string;

  // set while authenticating. resolves to true if completed or false if user
  // cancelled
  login?: Promise<boolean>;
}

export const ANONYMOUS_SESSION: Readonly<Session> = {
  state: "anonymous",
  uid: ANONYMOUS_UID,
  displayName: "Anonymous"
};

// .........................
// STATE
//

/** Current session */
export const sessions = state(ANONYMOUS_SESSION);

// .........................
// ACTIONS
//

const startLogin = (cancel = false) => {
  const self = (async () => {
    await sleep(1000);
    sessions.put(prior => {
      if (prior.login !== self) return prior; // replaced, abandon session
      return cancel
        ? { ...prior, login: undefined }
        : {
            state: "authenticated",
            uid: "dummy-001",
            displayName: "Charles Jolley"
          };
    });
    return !cancel;
  })();
  return self;
};

/** Request to begin a new login */
export const login = (cancel = false) =>
  sessions.put(prior =>
    prior.login ? prior : { ...prior, login: startLogin(cancel) }
  );

export const logout = () => sessions.put(() => ANONYMOUS_SESSION);

// ..............................
// LOGIN ACTIVITY.
//
