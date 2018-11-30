// tslint:disable max-classes-per-file

import {
  AnyIterator,
  AsyncIteratorResult,
  EMPTY_ASYNC_ITERATOR,
  isAsyncIterable,
  isAsyncIterator,
  isIterable,
  isIterator,
  isPromiseLike
} from "@plastic/utils";
import BufferChannel from "./buffer";
import { QueueChannel } from "./channels/queue";
import {
  $channel,
  AnyChannel,
  Channel,
  ChannelFilter,
  ChannelTransform,
  isChannelProxy,
  isWritableChannel,
  WritableChannel
} from "./types";

/** a pipe channel acts much like an iterable except it can have memory */
interface Pipe<T = any> extends AsyncIterable<T> {
  remember(limit?: number): this;
}

// internal use only
// prettier-ignore
type Transform1ValueType_<F, T = unknown> =
  // no transform function, passthrough type
  F extends undefined ? T

  // channel filter, pass through the type
  : F extends <U>(input: Channel<U>) => Channel<U> ? T
  
  // returns null or undefined, pass through type (it'll just be empty)
  : F extends (input: Channel<T>) => null | undefined ? T 
  
  // channel transform, extract from function
  : F extends (inpuy: Channel<T>) => Channel<infer V> ? V

  : never;

// internal use only.
type ChainedTransformValueType<
  T,
  F1 = undefined,
  F2 = undefined,
  F3 = undefined,
  F4 = undefined,
  F5 = undefined,
  F6 = undefined,
  F7 = undefined,
  F8 = undefined,
  F9 = undefined
> = Transform1ValueType_<
  F9,
  Transform1ValueType_<
    F8,
    Transform1ValueType_<
      F7,
      Transform1ValueType_<
        F6,
        Transform1ValueType_<
          F5,
          Transform1ValueType_<
            F4,
            Transform1ValueType_<
              F3,
              Transform1ValueType_<F2, Transform1ValueType_<F1, T>>
            >
          >
        >
      >
    >
  >
>;

/**
 * The next expected transform in a chain given a starting type and a tuple of
 * previous transforms.
 */
type ChainedTransform<
  T,
  F1 = undefined,
  F2 = undefined,
  F3 = undefined,
  F4 = undefined,
  F5 = undefined,
  F6 = undefined,
  F7 = undefined,
  F8 = undefined,
  F9 = undefined
> =
  | ChannelTransform<
      ChainedTransformValueType<T, F1, F2, F3, F4, F5, F6, F7, F8, F9>
    >
  | undefined;

type PipeReturnType<C, O = ChannelType<C>> = C extends WritableChannel<infer I>
  ? WritablePipe<I, O>
  : Pipe<O>;

type ChannelType<C> = C extends Channel<infer U> ? U : never;

interface PipeFn {
  <C extends AnyChannel>(ch: C): PipeReturnType<C>;

  <F1 extends ChainedTransform<T>, C extends Channel, T = ChannelType<C>>(
    input: C,
    f1: F1,
    ...filters: ChannelFilter[]
  ): PipeReturnType<C, ChainedTransformValueType<T, F1>>;
  <
    F1 extends ChainedTransform<T>,
    F2 extends ChainedTransform<T, F1>,
    C extends Channel<T>,
    T = ChannelType<C>
  >(
    input: C,
    f1: F1,
    f2: F2,
    ...filters: ChannelFilter[]
  ): PipeReturnType<C, ChainedTransformValueType<T, F1, F2>>;
  <
    F1 extends ChainedTransform<T>,
    F2 extends ChainedTransform<T, F1>,
    F3 extends ChainedTransform<T, F1, F2>,
    C extends Channel<T>,
    T = ChannelType<C>
  >(
    input: C,
    f1: F1,
    f2: F2,
    f3: F3,
    ...filters: ChannelFilter[]
  ): PipeReturnType<C, ChainedTransformValueType<T, F1, F2, F3>>;
  <
    F1 extends ChainedTransform<T>,
    F2 extends ChainedTransform<T, F1>,
    F3 extends ChainedTransform<T, F1, F2>,
    F4 extends ChainedTransform<T, F1, F2, F3>,
    C extends Channel<T>,
    T = ChannelType<C>
  >(
    input: C,
    f1: F1,
    f2: F2,
    f3: F3,
    f4: F4,
    ...filters: ChannelFilter[]
  ): PipeReturnType<C, ChainedTransformValueType<T, F1, F2, F3, F4>>;
  <
    F1 extends ChainedTransform<T>,
    F2 extends ChainedTransform<T, F1>,
    F3 extends ChainedTransform<T, F1, F2>,
    F4 extends ChainedTransform<T, F1, F2, F3>,
    F5 extends ChainedTransform<T, F1, F2, F3, F4>,
    C extends Channel<T>,
    T = ChannelType<C>
  >(
    input: C,
    f1: F1,
    f2: F2,
    f3: F3,
    f4: F4,
    f5: F5,
    ...filters: ChannelFilter[]
  ): PipeReturnType<C, ChainedTransformValueType<T, F1, F2, F3, F4, F5>>;
  <
    F1 extends ChainedTransform<T>,
    F2 extends ChainedTransform<T, F1>,
    F3 extends ChainedTransform<T, F1, F2>,
    F4 extends ChainedTransform<T, F1, F2, F3>,
    F5 extends ChainedTransform<T, F1, F2, F3, F4>,
    F6 extends ChainedTransform<T, F1, F2, F3, F4, F5>,
    C extends Channel<T>,
    T = ChannelType<C>
  >(
    input: C,
    f1: F1,
    f2: F2,
    f3: F3,
    f4: F4,
    f5: F5,
    f6: F6,
    ...filters: ChannelFilter[]
  ): PipeReturnType<C, ChainedTransformValueType<T, F1, F2, F3, F4, F5, F6>>;
  <
    F1 extends ChainedTransform<T>,
    F2 extends ChainedTransform<T, F1>,
    F3 extends ChainedTransform<T, F1, F2>,
    F4 extends ChainedTransform<T, F1, F2, F3>,
    F5 extends ChainedTransform<T, F1, F2, F3, F4>,
    F6 extends ChainedTransform<T, F1, F2, F3, F4, F5>,
    F7 extends ChainedTransform<T, F1, F2, F3, F4, F5, F6>,
    C extends Channel<T>,
    T = ChannelType<C>
  >(
    input: C,
    f1: F1,
    f2: F2,
    f3: F3,
    f4: F4,
    f5: F5,
    f6: F6,
    f7: F7,
    ...filters: ChannelFilter[]
  ): PipeReturnType<
    C,
    ChainedTransformValueType<T, F1, F2, F3, F4, F5, F6, F7>
  >;
  <
    F1 extends ChainedTransform<T>,
    F2 extends ChainedTransform<T, F1>,
    F3 extends ChainedTransform<T, F1, F2>,
    F4 extends ChainedTransform<T, F1, F2, F3>,
    F5 extends ChainedTransform<T, F1, F2, F3, F4>,
    F6 extends ChainedTransform<T, F1, F2, F3, F4, F5>,
    F7 extends ChainedTransform<T, F1, F2, F3, F4, F5, F6>,
    F8 extends ChainedTransform<T, F1, F2, F3, F4, F5, F6, F7>,
    C extends Channel<T>,
    T = ChannelType<C>
  >(
    input: C,
    f1: F1,
    f2: F2,
    f3: F3,
    f4: F4,
    f5: F5,
    f6: F6,
    f7: F7,
    f8: F8,
    ...filters: ChannelFilter[]
  ): PipeReturnType<
    C,
    ChainedTransformValueType<T, F1, F2, F3, F4, F5, F6, F7, F8>
  >;
  <
    F1 extends ChainedTransform<T>,
    F2 extends ChainedTransform<T, F1>,
    F3 extends ChainedTransform<T, F1, F2>,
    F4 extends ChainedTransform<T, F1, F2, F3>,
    F5 extends ChainedTransform<T, F1, F2, F3, F4>,
    F6 extends ChainedTransform<T, F1, F2, F3, F4, F5>,
    F7 extends ChainedTransform<T, F1, F2, F3, F4, F5, F6>,
    F8 extends ChainedTransform<T, F1, F2, F3, F4, F5, F6, F7>,
    F9 extends ChainedTransform<T, F1, F2, F3, F4, F5, F6, F7, F8>,
    C extends Channel<T>,
    T = ChannelType<C>
  >(
    input: C,
    f2: F2,
    f1: F1,
    f3: F3,
    f4: F4,
    f5: F5,
    f6: F6,
    f7: F7,
    f8: F8,
    f9: F9,
    ...filters: ChannelFilter[]
  ): PipeReturnType<
    C,
    ChainedTransformValueType<T, F1, F2, F3, F4, F5, F6, F7, F8, F9>
  >;
  <T = ChannelType<C>, C extends Channel<any> = Channel<any>>(
    input: C,
    f1: ChannelTransform,
    f2: ChannelTransform,
    f3: ChannelTransform,
    f4: ChannelTransform,
    f5: ChannelTransform,
    f6: ChannelTransform,
    f7: ChannelTransform,
    f8: ChannelTransform,
    f9: ChannelTransform,
    f10: ChannelTransform,
    ...extra: ChannelTransform[]
  ): PipeReturnType<C, T>;
}

class IteratorPipe<T> extends BufferChannel<T> implements Pipe<T> {
  constructor(readonly iter: AnyIterator<T>, limit: number) {
    super(limit);
  }

  fetch() {
    return this.iter.next();
  }
}

class PromisePipe<T> extends BufferChannel<T> implements Pipe<T> {
  constructor(private _pr: undefined | Promise<T>, limit: number) {
    super(limit);
  }

  async fetch() {
    const value = this._pr || (await this._pr);
    this._pr = undefined;
    return ({ done: true, value } as unknown) as AsyncIteratorResult<T>;
  }
}

class WritablePipe<I = any, O = I> implements WritableChannel<I>, Pipe<O> {
  constructor(readonly input: WritableChannel<I>, readonly output: Pipe<any>) {}
  get writable() {
    return this.input.writable;
  }
  put(value: I) {
    this.input.put(value);
  }
  close() {
    this.input.close();
  }
  error(reason?: any) {
    this.input.error(reason);
  }

  remember(limit = Number.MAX_SAFE_INTEGER) {
    this.output.remember(limit);
    return this;
  }

  [Symbol.asyncIterator]() {
    return this.output[Symbol.asyncIterator]();
  }
}

const isKnownPipe = (x: any): x is Pipe =>
  x instanceof BufferChannel || x instanceof WritablePipe;

export const isPipe = <T = any>(x: any): x is Pipe<T> =>
  isKnownPipe(x) ||
  (isAsyncIterable(x) && "function" === typeof (x as any).remember);

const pipes = new WeakMap<Channel, Pipe>();

function toPipe(input: Channel): Pipe;
function toPipe(input: WritableChannel & Channel): WritablePipe;
function toPipe(input: Channel) {
  if (Array.isArray(input) && input.length === 0) input = EMPTY_ASYNC_ITERATOR;

  let ret = pipes.get(input);
  if (ret) return ret;

  const output = isKnownPipe(input)
    ? input
    : isChannelProxy(input)
    ? toPipe(input[$channel]())
    : isAsyncIterable(input)
    ? isPipe(input)
      ? input
      : toPipe(input[Symbol.asyncIterator]())
    : isIterable(input)
    ? toPipe(input[Symbol.iterator]())
    : isIterator(input) || isAsyncIterator(input)
    ? new IteratorPipe(input, 0)
    : isPromiseLike(input)
    ? new PromisePipe(input, 0)
    : input;
  ret =
    output !== input && isWritableChannel(input)
      ? new WritablePipe(input, output as Pipe)
      : output;
  if (ret) pipes.set(input, ret);
  return ret;
}

/**
 * Determines the maximum amount of recent values to save and replay to new
 * readers. Set via a parameter passed to the constructor. There are three
 * common settings for this value, although you can set it to any
 * non-negative integer:
 *
 *  | Value             | Meaning           | Use Case                    |
 *  | ----------------- | ----------------- | --------------------------- |
 *  | `0`               | Event Emitters    | History disabled.           |
 *  | `1`               | State observables | Replays most recent value.  |
 *  | `queue.MAX_LIMIT` | Collections       | Replays all values          |
 *
 */
export const remember = <C extends AnyChannel>(
  ch: C,
  limit = Number.MAX_SAFE_INTEGER
) => {
  pipe(ch).remember(limit);
  return ch;
};

/**
 * Returns an iterable channel for an input channel, which can be passed to any
 * async iteration loop, such as `for await...of`. This is a pure function that
 * will reuse its own cached results, so it is safe and fast to call repeatedly
 * when you need to ensure a given input channel is iterable.
 *
 * If you include additional transforms, they will be composed together in the
 * order passed and a channel returned based on that value.
 *
 * @param input source channel
 * @param transforms (Optional) transforms to compose onto channel
 */
export const pipe = ((input: Channel, ...transforms: ChannelTransform[]) => {
  let output = input;
  for (const next of transforms) output = next(output);
  return output !== input && isWritableChannel(input)
    ? new WritablePipe(input, toPipe(output))
    : toPipe(output);
}) as PipeFn;

export default pipe;
