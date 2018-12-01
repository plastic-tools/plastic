/** Returns a promise that resolve after the specified time has elapsed */
export const sleep = (period: number) =>
  new Promise<void>(resolve => setTimeout(resolve, period));

export default sleep;
