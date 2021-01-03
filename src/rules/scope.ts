import {
  AST_NODE_TYPES,
  TSESLint,
  TSESTree,
} from "@typescript-eslint/experimental-utils";
import memoizeOne from "memoize-one";
import { isExportDeclartation } from "../utils/export";
import { getVarScope } from "../utils/scope";
import {
  getFunctionParameterVariables,
  getPatternVariables,
  getVariableDeclarationVariables,
} from "../utils/variables";
import { getScopeLocation, ScopeLocation } from "./block";

type MessageId = "min" | "max";

type RuleOptions = {
  lengthCount: "length" | "codePoint" | ((id: string) => number);
  checkFunctionName?: boolean;
  checkExportedName?: boolean;
  limit: (
    scopeLocation: ScopeLocation
  ) => number | { min?: number; max?: number };
};

type LimitFunction = (
  scopeLocation: ScopeLocation
) => { min: number; max: number };

const defaultLimitFunction: LimitFunction = (scopeLocation: ScopeLocation) => {
  return {
    // 1 => 1, 2...4 => 2, 5...9 => 3, ...
    min: Math.ceil(Math.sqrt(scopeLocation.lineCount)),
    max: Infinity,
  };
};

const rule: Omit<
  TSESLint.RuleModule<MessageId, [Partial<RuleOptions>?]>,
  "docs"
> = {
  meta: {
    type: "problem",
    docs: {
      category: "Possible Errors",
      description: "Force variables that live longer to have longer name.",
      recommended: "error",
      url: "TODO",
    },
    messages: {
      min: "This Variable must have at least {{ length }} characters.",
      max: "This Variable must have at most {{ length }} characters.",
    },
    schema: [
      {
        type: "object",
        properties: {
          checkFunctionName: {
            type: "boolean",
          },
          checkExportedName: {
            type: "boolean",
          },
        },
        propertyNames: {
          enum: [
            "lengthCount",
            "checkFunctionName",
            "checkExportedName",
            "limit",
          ],
        },
      },
    ],
  },
  create: function (context) {
    const options = context.options[0] || {};
    const lengthCountFunction =
      options.lengthCount === "codePoint"
        ? (str: string) => [...str].length
        : typeof options.lengthCount === "function"
        ? options.lengthCount
        : (str: string) => str.length;
    const limit = options.limit;
    const limitFunction: LimitFunction =
      typeof limit === "function"
        ? (scopeLocation: ScopeLocation) => {
            const l = limit(scopeLocation);
            return typeof l === "number"
              ? {
                  min: l,
                  max: Infinity,
                }
              : {
                  min: l.min ?? 0,
                  max: l.max ?? Infinity,
                };
          }
        : defaultLimitFunction;

    const checkFunctionName = options.checkFunctionName ?? false;
    const checkExportedName = options.checkExportedName ?? false;

    return {
      FunctionDeclaration: checkFunctionLike,
      FunctionExpression: checkFunctionLike,
      ArrowFunctionExpression: checkFunctionLike,
      VariableDeclaration: (node) => {
        if (!checkExportedName && isExportDeclartation(node.parent)) {
          return;
        }
        const vars = getVariableDeclarationVariables(node);
        const scope = context.getScope();
        const effectiveScope = node.kind === "var" ? getVarScope(scope) : scope;
        for (const v of vars) {
          checkForScope(
            context,
            lengthCountFunction,
            limitFunction,
            v,
            effectiveScope
          );
        }
      },
      CatchClause: (node) => {
        const vars = getPatternVariables(node.param);
        const scope = context.getScope();
        for (const v of vars) {
          checkForScope(context, lengthCountFunction, limitFunction, v, scope);
        }
      },
    };
    function checkFunctionLike(
      node:
        | TSESTree.FunctionDeclaration
        | TSESTree.FunctionExpression
        | TSESTree.ArrowFunctionExpression
    ) {
      const vars = getFunctionParameterVariables(node);
      const scope = context.getScope();
      // check function name
      if (node.type === AST_NODE_TYPES.FunctionDeclaration) {
        if (
          checkFunctionName &&
          (checkExportedName || !isExportDeclartation(node.parent))
        ) {
          const funcNameScope = scope.upper;
          if (funcNameScope && node.id) {
            checkForScope(
              context,
              lengthCountFunction,
              limitFunction,
              node.id,
              funcNameScope
            );
          }
        }
      }
      for (const v of vars) {
        checkForScope(context, lengthCountFunction, limitFunction, v, scope);
      }
    }
  },
};

export default rule;

const getScopeLocationMemo = memoizeOne(getScopeLocation);

function checkForScope(
  context: Readonly<TSESLint.RuleContext<MessageId, unknown[]>>,
  lengthCountFunction: (str: string) => number,
  limitFunction: LimitFunction,
  identifier: TSESTree.Identifier,
  scope: TSESLint.Scope.Scope
) {
  const scopeLoc = getScopeLocationMemo(scope.block);
  const idLength = lengthCountFunction(identifier.name);
  const limit = limitFunction(scopeLoc);
  if (idLength < limit.min) {
    context.report({
      node: identifier,
      messageId: "min",
      data: {
        length: limit.min,
      },
    });
  } else if (idLength > limit.max) {
    context.report({
      node: identifier,
      messageId: "max",
      data: {
        length: limit.max,
      },
    });
  }
}
