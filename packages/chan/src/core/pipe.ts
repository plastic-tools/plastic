// tslint:disable no-shadowed-variable

import { AnyIterator, isObjectLike } from "@plastic/utils";
import { chan, ChannelSource } from "./chan";
import { $PipeInput, Channel, ChannelFilter, ChannelTransform } from "./types";

type AnyChannel<T = any> = Channel<T>;
type AnyChannelSource = ChannelSource<any>;

// ...

// prettier-ignore
// given a channel input type, extracts the channel input
type ChannelType<S extends AnyChannelSource> =
  S extends Channel<infer U>
  ? U
  : S extends AsyncIterable<infer U>
  ? U
  : S extends Iterable<infer U>
  ? U
  : S extends AnyIterator<infer U>
  ? U
  : S extends Promise<infer U>
  ? U
  : never;

// prettier-ignore
// finds the output channel type given an input channel type and a transform
type TransformValueType<F, T=unknown> =
  // to transform function, pass through type
  F extends undefined ? T
  // channel filter, pass through type
  : F extends <U>(input: Channel<U>) => Channel<U> ? T
  // returns null or undefined, pass through type (i'll just be empty)
  : F extends (input: Channel<T>) => null | undefined ? T
  // channel transform, extract from function
  : F extends (input: Channel<T>) => Channel<infer V> ? V
  : never;

// prettier-ignore
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
> =
  TransformValueType<F9,
    TransformValueType<F8,
      TransformValueType<F7,
        TransformValueType<F6,
          TransformValueType<F5,
            TransformValueType<F4,
              TransformValueType<F3,
                TransformValueType<F2,
                  TransformValueType<F1, T>>>>>>>>>;

// prettier-ignore
// @internal
// The next expected transform in a chain given a starting type and a tuple of
// previous transforms.
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

// prettier-ignore
// given an output channel type and an input channel, returns output channel
// type with any input type added
type PipeReturnType<T, S extends ChannelSource<any>> =
  S extends { [$PipeInput](): infer U } ? Channel<T> & U : Channel<T>;

interface PipeFn {
  <C extends AnyChannel>(input: C): C;
  <S extends AnyChannelSource, T = ChannelType<S>>(
    source: S,
    ...filters: ChannelFilter[]
  ): PipeReturnType<T, S>;
  <
    F1 extends ChainedTransform<T>,
    S extends AnyChannelSource,
    T = ChannelType<S>
  >(
    source: S,
    f1: F1,
    ...filters: ChannelFilter[]
  ): PipeReturnType<ChainedTransformValueType<T, F1>, S>;
  <
    F1 extends ChainedTransform<T>,
    F2 extends ChainedTransform<T, F1>,
    S extends AnyChannelSource,
    T = ChannelType<S>
  >(
    source: S,
    f1: F1,
    f2: F2,
    ...filters: ChannelFilter[]
  ): PipeReturnType<ChainedTransformValueType<T, F1, F2>, S>;
  <
    F1 extends ChainedTransform<T>,
    F2 extends ChainedTransform<T, F1>,
    F3 extends ChainedTransform<T, F1, F2>,
    S extends AnyChannelSource,
    T = ChannelType<S>
  >(
    source: S,
    f1: F1,
    f2: F2,
    f3: F3,
    ...filters: ChannelFilter[]
  ): PipeReturnType<ChainedTransformValueType<T, F1, F2, F3>, S>;
  <
    F1 extends ChainedTransform<T>,
    F2 extends ChainedTransform<T, F1>,
    F3 extends ChainedTransform<T, F1, F2>,
    F4 extends ChainedTransform<T, F1, F2, F3>,
    S extends AnyChannelSource,
    T = ChannelType<S>
  >(
    source: S,
    f1: F1,
    f2: F2,
    f3: F3,
    f4: F4,
    ...filters: ChannelFilter[]
  ): PipeReturnType<ChainedTransformValueType<T, F1, F2, F3, F4>, S>;
  <
    F1 extends ChainedTransform<T>,
    F2 extends ChainedTransform<T, F1>,
    F3 extends ChainedTransform<T, F1, F2>,
    F4 extends ChainedTransform<T, F1, F2, F3>,
    F5 extends ChainedTransform<T, F1, F2, F3, F4>,
    S extends AnyChannelSource,
    T = ChannelType<S>
  >(
    source: S,
    f1: F1,
    f2: F2,
    f3: F3,
    f4: F4,
    f5: F5,
    ...filters: ChannelFilter[]
  ): PipeReturnType<ChainedTransformValueType<T, F1, F2, F3, F4, F5>, S>;
  <
    F1 extends ChainedTransform<T>,
    F2 extends ChainedTransform<T, F1>,
    F3 extends ChainedTransform<T, F1, F2>,
    F4 extends ChainedTransform<T, F1, F2, F3>,
    F5 extends ChainedTransform<T, F1, F2, F3, F4>,
    F6 extends ChainedTransform<T, F1, F2, F3, F4, F5>,
    S extends AnyChannelSource,
    T = ChannelType<S>
  >(
    source: S,
    f1: F1,
    f2: F2,
    f3: F3,
    f4: F4,
    f5: F5,
    f6: F6,
    ...filters: ChannelFilter[]
  ): PipeReturnType<ChainedTransformValueType<T, F1, F2, F3, F4, F5, F6>, S>;

  input: typeof $PipeInput;
}

const addPipeInput = (output: Channel, source: any) => {
  const props =
    isObjectLike(source) &&
    "function" === typeof source[$PipeInput] &&
    source[$PipeInput]();
  if (!props || !isObjectLike(props)) return output;
  return {
    ...props,
    [Symbol.asyncIterator]: () => output[Symbol.asyncIterator]()
  };
};

/**
 * Returns a new channel composed of the input channel combines with any passed
 * transforms. If the input channel defines a `pipe.input` (also exported as
 * `$PipeInput`) and you pass transforms, then they will be copied onto
 * the returned channel.
 */
export const pipe = ((
  input: AnyChannelSource,
  ...transforms: ChannelTransform[]
) => {
  let output: Channel = chan(input);
  for (const fn of transforms) output = fn(output);
  if (transforms.length > 0) output = addPipeInput(output, input);
  return output;
}) as PipeFn;

pipe.input = $PipeInput;

export default pipe;
