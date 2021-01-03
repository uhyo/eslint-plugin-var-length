import { TSESLint } from "@typescript-eslint/experimental-utils";

/**
 * Traverse up to non-block scope.
 */
export function getVarScope(scope: TSESLint.Scope.Scope): TSESLint.Scope.Scope {
  while (
    scope.type === TSESLint.Scope.ScopeType.block ||
    scope.type === TSESLint.Scope.ScopeType.switch ||
    scope.type === TSESLint.Scope.ScopeType.for
  ) {
    scope = scope.upper;
  }
  return scope;
}
