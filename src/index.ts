import scope from "./rules/scope";

export = {
  rules: {
    scope: scope,
  },
  configs: {
    all: {
      plugins: ["var-length"],
      rules: {
        "var-length/scope": "error",
      },
    },
  },
};
