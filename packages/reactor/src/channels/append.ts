import { Channel } from "../core";
import reduce from "./reduce";

// prettier-ignore
/**
 * Returns a channel that will collect all values outputted by the input
 * channel into an output array.
 *
 * Closes when input channel closes. Throws when input channel throws.
 */
export const append =
  reduce((prior = [], next: any) => [...prior, next]) as
    (<T>(input: Channel<T>) => Channel<T[]>);
