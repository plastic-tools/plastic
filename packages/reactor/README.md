# Plastic Reactor

A library for working with async iteratable streams of data.

## Concepts

> TODO: improve

### Channels

A **channel** is any object that implements the `AsyncIterable` interface. ES6
comes with builtin support for async iterables, which makes them natural to
work with.

For example, you can easily create a new channel using an async generator
function:

```@typescript
/** Creates a new channel that will emit some numbers */
async function* count() {
  yield 1;
  yield 10;
  yield 15;
}
```

The easiest way to read a channel is to use the `for await...of` expression in
ES6. You only need to be inside of an async function to use it:

```@typescript
async function logCounts() {
  const numbers = count(); // make a channel of names
  for await (const count of numbers) {
    console.log(count);
  }
}
logCounts();

// 1
// 10
// 15
```

The `count()` function above is an example of a **channel factory**, a function
that will return a new channel each time it is called. All async generators are
channel factories. `logCounts()` is an example of a **reader**, which is any code that iterates over the values of a channel.

> **NOTE:** Channel factories are usually named with a verb describing how the values
> will be produced whereas a channel instance is usually named as a plural
> noun and variables holding individual values are named with a singular
> noun.

### Transform Channels

Most channels you create won't derive their values from scratch, but instead
will compute its output based on the output of other channels. We call these
**transform channels** and the channels they rely upon **input** or **source**
channels.

You can create a transform channel easily by combining the reading and writing
methods shown above. For example, below is a channel that converts a number to
a "rough measure" string:

```@typescript
async function* summarize(input:Channel<number>):Channel<[string,number]> {
  for await (const value of input) {
    if (value === 0) yield ["none", value];
    else if (value === 1) yield ["one", value];
    else if (value <= 10) yield ["a few", value];
    else yield ["many", value];
  }
}

async function reader() {
  for await(const [str, value] of summarize(numbers())) {
    console.log(str, value);
  }
}
reader();

// one 1
// a few 10
// many 15
```

When you define a transform, you should specify the types of channels you can
accept as input. If the return type cannot be inferred then you should specify
the return type as well.

> **NOTE:** The Reactor library defines a helper type you can use for this
> called `Channel`. It is primarily an alias for `AsyncIterable<T>`, which you
> can also use. If you do not care what type of value a channel emits, you can
> omit the type altogether. This will give the channel value a type of
> `unknown`, which is preferred to `Channel<any>` because it will enforce
> stricter type checking.

### Filters

A **filter channel** is a transform channel that returns the same value type
as it's inputs. When you define a filter, be sure to use the template type as
shown below in order to get proper typing support:

```@typescript
// skip every other value
async function* skip<T>(input:Channel<T>):Channel<T> {
  let skip = false;
  for await (const next of input) {
    if (!skip) yield next;
    skip = !skip;
  }
}
```

## Library Helpers

The Reactor library provides helper and factory functions that make it easier
to create and work with channels.

### `chan()`

The `chan()` function will accept a variety of inputs and convert them into
a channel. It caches it's results so that calling this method multiple times
with the same value is very cheap. It's useful when you want to quickly create
a channel from an iterable or you want to ensure an unknown value is a channel.

```@typescript
// returns a channel that will return the numbers in the array
const numbers = chan([1,2,3]);

// ensures `input` is an iterable channel (or returns an empty channel)
async function reader(input:any) {
  for await (const value of chan(input)) {
    // do something with value
  }
}
```

### `pipe()`

Constructs a new channel by combining several inputs...

**TODO add more**
