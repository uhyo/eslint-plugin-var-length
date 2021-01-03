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
  checkFunctionName: boolean;
  checkExportedName: boolean;
  limit: LimitOption;
};

type LimitOption =
  | {
      mode?: "quadratic";
      factor?: number;
    }
  | ((scopeLocation: ScopeLocation) => number | { min?: number; max?: number });

type LimitFunction = (
  scopeLocation: ScopeLocation
) => { min: number; max: number };

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
    const limitFunction = getLimitFunction(options.limit);

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

function getLimitFunction(limit: LimitOption = {}): LimitFunction {
  if (typeof limit === "function") {
    return (scopeLocation: ScopeLocation) => {
      const result = limit(scopeLocation);
      return typeof result === "number"
        ? {
            min: result,
            max: Infinity,
          }
        : {
            min: result.min ?? 0,
            max: result.max ?? Infinity,
          };
    };
  } else if (!limit.mode || limit.mode === "quadratic") {
    // quadratic
    const factor = limit.factor || 0.75;
    return (scopeLocation) => {
      return {
        min: Math.ceil(factor * Math.ceil(Math.sqrt(scopeLocation.lineCount))),
        max: Infinity,
      };
    };
  } else {
    throw new Error("'limit' option has unknown mode");
  }
}

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
  // exclude type annotation from error location
  const loc: TSESTree.SourceLocation | undefined = identifier.typeAnnotation
    ? {
        start: identifier.loc.start,
        end: {
          line: identifier.loc.start.line,
          column: identifier.loc.start.column + identifier.name.length,
        },
      }
    : undefined;
  if (idLength < limit.min) {
    context.report({
      node: identifier,
      loc,
      messageId: "min",
      data: {
        length: limit.min,
      },
    });
  } else if (idLength > limit.max) {
    context.report({
      node: identifier,
      loc,
      messageId: "max",
      data: {
        length: limit.max,
      },
    });
  }
}
