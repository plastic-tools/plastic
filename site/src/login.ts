import { Channel, repeat, state } from "@plastic/reactor";
import { sleep } from "@plastic/utils";
import activity from "./activity";
import { Session } from "./session";

// Ideally we would have some way to limit how many of these can run at once
// and possibly to even coordinate them

/** Begins a new login activity. */
export const createLoginActivity = (cancel = false) => {
  const aborted = false;
};

type Login = Channel<"pending" | "cancelled" | "aborted" | Session>;

export const logins = state<Login | undefined>();

export const login = () =>
  logins.put(() =>
    repeat(
      activity(async (update, self) => {
        update("pending");
        await sleep(2000);
        return {
          state: "authenticated",
          uid: "test-uid",
          displayName: "Charles Jolley"
        } as Session;
      })
    )
  );

export const abortLogin = () =>
  logins.put(() => {
    console.log("applying abort");
    return undefined;
  });
