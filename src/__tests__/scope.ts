/* eslint-disable local-rules/scope */
import { TSESLint } from "@typescript-eslint/experimental-utils";
import varLengthScopeRule from "../rules/scope";

const ruleName = "scope";
const tester = new TSESLint.RuleTester({
  parser: require.resolve("espree"),
  parserOptions: { ecmaVersion: 2020, sourceType: "module" },
});

describe("FunctionDeclaration", () => {
  tester.run(ruleName, varLengthScopeRule, {
    valid: [
      {
        code: `function func(a) {
          return a;
        }`,
      },
      {
        code: `function func(aa) {
          const bbb = aa + aa;
          return bbb;
        }`,
      },
      {
        options: [
          {
            checkFunctionName: true,
          },
        ],
        code: `function fu() {
        }`,
      },
    ],
    invalid: [
      {
        code: `function func(a) {
          const a2 = a + a;
          return a2;
        }`,
        errors: [
          {
            messageId: "min",
            data: {
              length: 2,
            },
          },
        ],
      },
      {
        options: [
          {
            checkFunctionName: true,
          },
        ],
        code: `function f() {
        }
        export function g() {
        }`,
        errors: [
          {
            messageId: "min",
            data: {
              length: 2,
            },
          },
        ],
      },
      {
        options: [
          {
            checkFunctionName: true,
            checkExportedName: true,
          },
        ],
        code: `function f() {
        }
        export function g() {
        }`,
        errors: [
          {
            messageId: "min",
            data: {
              length: 2,
            },
          },
          {
            messageId: "min",
            data: {
              length: 2,
            },
          },
        ],
      },
    ],
  });
});

describe("FunctionExpression", () => {
  tester.run(ruleName, varLengthScopeRule, {
    valid: [
      {
        code: `(function(a) {
          return a;
        })(123);`,
      },
      {
        code: `+function func(aa) {
          const bbb = aa + aa;
          return bbb;
        }(123);`,
      },
    ],
    invalid: [
      {
        code: `!function func(a) {
          const a22 = a + a;



          return a22;
        }()`,
        errors: [
          {
            messageId: "min",
            data: {
              length: 3,
            },
          },
        ],
      },
    ],
  });
});

describe("ArrowFunctionExpression", () => {
  tester.run(ruleName, varLengthScopeRule, {
    valid: [
      {
        code: `((a)=> {
          return a;
        })(123);`,
      },
      {
        code: `(async (aa)=>{
          const bbb = aa + aa;
          return bbb;
        })(123);`,
      },
    ],
    invalid: [
      {
        code: `((a)=> {
          const a2 = a + a;
          return a2;
        })()`,
        errors: [
          {
            messageId: "min",
            data: {
              length: 2,
            },
          },
        ],
      },
    ],
  });
});

describe("VariableDeclaration", () => {
  tester.run(ruleName, varLengthScopeRule, {
    valid: [
      {
        code: `function ffffffff() {
          var a;
        }`,
      },
      {
        code: `function ffffffff(obj) {
          const { aa, bb, cc } = obj;
          return aa + bb + cc;
        }`,
      },
      {
        code: `function ffffffff(obj) {
          const { a: aa, b: bb, c: cc } = obj;
          return aa + bb + cc;
        }`,
      },
      {
        code: `let a = 123;`,
      },
      {
        code: `export let a = 0;
        a += 12345;`,
      },
    ],
    invalid: [
      {
        code: `function ffffffff() {
          var a = 1;
          return a * 10;
        }`,
        errors: [
          {
            messageId: "min",
            data: {
              length: 2,
            },
          },
        ],
      },
      {
        code: `function ffffffff(obj) {
          const { x, y, z } = obj;
          return x + y + z;
        }`,
        errors: [
          {
            messageId: "min",
            data: {
              length: 2,
            },
          },
          {
            messageId: "min",
            data: {
              length: 2,
            },
          },
          {
            messageId: "min",
            data: {
              length: 2,
            },
          },
        ],
      },
      {
        code: `let a = 123,
        //
        //
        //
        abc = 4;`,
        errors: [
          {
            messageId: "min",
            data: {
              length: 3,
            },
          },
        ],
      },
      {
        code: `for (const i of arr) {
          console.log(i);
          i;
        }`,
        errors: [
          {
            messageId: "min",
            data: {
              length: 2,
            },
          },
        ],
      },
      {
        code: `export let a = 0;
        a += 12345;`,
        options: [
          {
            checkExportedName: true,
          },
        ],
        errors: [
          {
            messageId: "min",
            data: {
              length: 2,
            },
          },
        ],
      },
    ],
  });
});

describe("CatchClause", () => {
  tester.run(ruleName, varLengthScopeRule, {
    valid: [
      {
        code: `try {}
        catch ({ e }) {
          console.error(e);
        }`,
      },
    ],
    invalid: [
      {
        code: `try {}
        catch ({ e, ee }) {
          console.error(e);
          console.error(ee);
        }`,
        errors: [
          {
            messageId: "min",
            data: {
              length: 2,
            },
          },
        ],
      },
    ],
  });
});
