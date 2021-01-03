# eslint-plugin-var-length

ESLint plugin to restrict short variable name. Currently has one rule:

- **var-length/scope**: force variables that live in larger scope to have longer name.

## Installation

```sh
npm i -D eslint-plugin-var-length
```

```js
// .eslintrc.js
  "plugins": [
    // ...
    "var-length"
  ],
```

## `var-length/scope`

```js
// .eslintrc.js
  "rules": {
    // ...
    "var-length/scope": ["error"]
  }
```

This rule forces variables that live in larger scope to have longer name.

Examples of **incorrect** code for this rule:

```js
// Argument 'x' must have at least 2 characters
function double(x) {
  const result = x * x;
  return result;
}
```

Examples of **correct** code for this rule:

```js
// Argument 'x' can be one character long because this function is short
function double(x) {
  return x * x;
}
```

### Options

This rule accepts an object with following properties (all optional):

- `lengthCount`: `"length"`, `"codePoint"` or a function `(str: string) => number` (default: `"length"`). Specifies how to calculate the length of a variable name.
  - `"length"`: equivalent to `(str: string) => str.length`.
  - `"codePoint"`: equivalent to `(str: string) => [...str].length`.
- `checkFunctionName`: boolean value (default: `false`). If set to `true`, function names in function declarations are also checked.
- `checkExportedName`: boolean value (default: `false`). If set to `true`, exported variable names are also checked.
- `limit`: Object or function to specify how to calculate the minimum variable length for given scope (see below; defaults to `{ factor: 0.75 }`).

#### The `limit` option

By default, the minumum variable length is quadratic to the number of lines in the surrounding scope:

```js
minimumLength = Math.ceil(factor * Math.sqrt(linesCount));
```

The `factor` defaults to `0.75`. By passing an object of the form `{ factor: num }` as the `limit` option, you can override the factor. A smaller factor is more permissive.

If you want more control on how to calculate the minimum length, pass a function as `limit`.

## Contributing

Welcome

## License

MIT
