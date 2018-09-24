import { track } from "@plastic/reactor";

export type PromiseState = "pending" | "resolved" | "rejected";

export default class TrackedPromise<T> extends Promise<T> {
  @track
  state: PromiseState = "pending";

  @track
  value: T;

  @track
  reason: any;

  constructor(
    fn: (resolve: (v: T) => any, reject: (error: any) => any) => any
  ) {
    super((resolve, reject) =>
      fn(
        (v: T) => {
          this.state = "resolved";
          this.value = v;
          return resolve(v);
        },
        (error: any) => {
          this.state = "rejected";
          this.reason = error;
          return reject(error);
        }
      )
    );
  }
}
