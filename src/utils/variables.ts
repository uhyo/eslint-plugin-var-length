import {
  AST_NODE_TYPES,
  TSESTree,
} from "@typescript-eslint/experimental-utils";

export function getFunctionParameterVariables(
  decl:
    | TSESTree.FunctionDeclaration
    | TSESTree.FunctionExpression
    | TSESTree.ArrowFunctionExpression
): TSESTree.Identifier[] {
  return decl.params.flatMap(getPatternVariables);
}

function getPatternVariables(
  pat:
    | TSESTree.ArrayPattern
    | TSESTree.ObjectPattern
    | TSESTree.Identifier
    | TSESTree.AssignmentPattern
    | TSESTree.MemberExpressionComputedName
    | TSESTree.MemberExpressionNonComputedName
    | TSESTree.PropertyComputedName
    | TSESTree.PropertyNonComputedName
    | TSESTree.RestElement
    | TSESTree.TSParameterProperty
    | null
): TSESTree.Identifier[] {
  if (pat === null) {
    return [];
  }
  switch (pat.type) {
    case AST_NODE_TYPES.ArrayPattern: {
      return pat.elements.flatMap(getPatternVariables);
    }
    case AST_NODE_TYPES.ObjectPattern: {
      return pat.properties.flatMap(getPatternVariables);
    }
    case AST_NODE_TYPES.Identifier: {
      return [pat];
    }
    case AST_NODE_TYPES.AssignmentPattern: {
      return getPatternVariables(pat.left);
    }
    case AST_NODE_TYPES.MemberExpression: {
      return [];
    }
    case AST_NODE_TYPES.Property: {
      return [];
    }
    case AST_NODE_TYPES.RestElement: {
      return getPatternVariables(pat.argument);
    }
    case AST_NODE_TYPES.TSParameterProperty: {
      return getPatternVariables(pat.parameter);
    }
  }
}
