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

export function getVariableDeclarationVariables(
  decl: TSESTree.VariableDeclaration
): TSESTree.Identifier[] {
  return decl.declarations.flatMap((declarator) => {
    return getPatternVariables(declarator.id);
  });
}

export function getPatternVariables(
  pattern: TSESTree.Node | null
): TSESTree.Identifier[] {
  if (pattern === null) {
    return [];
  }
  switch (pattern.type) {
    case AST_NODE_TYPES.ArrayPattern: {
      return pattern.elements.flatMap(getPatternVariables);
    }
    case AST_NODE_TYPES.ObjectPattern: {
      return pattern.properties.flatMap(getPatternVariables);
    }
    case AST_NODE_TYPES.Identifier: {
      return [pattern];
    }
    case AST_NODE_TYPES.AssignmentPattern: {
      return getPatternVariables(pattern.left);
    }
    case AST_NODE_TYPES.Property: {
      return getPatternVariables(pattern.value);
    }
    case AST_NODE_TYPES.RestElement: {
      return getPatternVariables(pattern.argument);
    }
    case AST_NODE_TYPES.TSParameterProperty: {
      return getPatternVariables(pattern.parameter);
    }
    default: {
      return [];
    }
  }
}
