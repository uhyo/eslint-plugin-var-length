import { TSESLint } from "@typescript-eslint/experimental-utils";
import rule from "../rules/scope";

const ruleName = "scope";
const tester = new TSESLint.RuleTester({
  parser: require.resolve("espree"),
  parserOptions: { ecmaVersion: 2020 },
});

describe("FunctionDeclaration", () => {
  tester.run(ruleName, rule, {
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
    ],
  });
});
