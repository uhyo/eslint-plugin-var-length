import {
  AST_NODE_TYPES,
  TSESTree,
} from "@typescript-eslint/experimental-utils";

export interface ScopeLocation {
  firstElement: TSESTree.Node;
  lastElement: TSESTree.Node;
  startLine: number;
  endLine: number;
  lineCount: number;
}

type Block =
  | TSESTree.BlockStatement
  | TSESTree.FunctionDeclaration
  | TSESTree.ArrowFunctionExpression
  | TSESTree.CatchClause
  | TSESTree.ClassDeclaration
  | TSESTree.ClassExpression
  | TSESTree.ForInStatement
  | TSESTree.ForOfStatement
  | TSESTree.ForStatement
  | TSESTree.FunctionExpression
  | TSESTree.Program
  | TSESTree.SwitchStatement
  | TSESTree.WithStatement
  | TSESTree.TSConditionalType
  | TSESTree.TSCallSignatureDeclaration
  | TSESTree.TSConstructorType
  | TSESTree.TSConstructSignatureDeclaration
  | TSESTree.TSDeclareFunction
  | TSESTree.TSEmptyBodyFunctionExpression
  | TSESTree.TSEnumDeclaration
  | TSESTree.TSFunctionType
  | TSESTree.TSInterfaceDeclaration
  | TSESTree.TSMappedType
  | TSESTree.TSMethodSignatureComputedName
  | TSESTree.TSMethodSignatureNonComputedName
  | TSESTree.TSModuleDeclaration
  | TSESTree.TSTypeAliasDeclaration;

export function getScopeLocation(block: Block): ScopeLocation {
  const [firstElement, lastElement] = getEdgeElements(block);
  const startLine = firstElement.loc.start.line;
  const endLine = lastElement.loc.end.line;
  const lineCount = endLine - startLine + 1;
  return {
    firstElement,
    lastElement,
    startLine,
    endLine,
    lineCount,
  };
}

function getEdgeElements(block: Block): [TSESTree.Node, TSESTree.Node] {
  switch (block.type) {
    case AST_NODE_TYPES.BlockStatement: {
      return edges(block.body, block);
    }
    case AST_NODE_TYPES.FunctionDeclaration:
    case AST_NODE_TYPES.FunctionExpression: {
      return edges(block.body.body, block.body);
    }
    case AST_NODE_TYPES.ArrowFunctionExpression: {
      return getEdgeOfStatement(block.body);
    }
    case AST_NODE_TYPES.CatchClause: {
      return getEdgeElements(block.body);
    }
    case AST_NODE_TYPES.ClassDeclaration:
    case AST_NODE_TYPES.ClassExpression: {
      return edges(block.body.body, block.body);
    }
    case AST_NODE_TYPES.ForInStatement:
    case AST_NODE_TYPES.ForOfStatement:
    case AST_NODE_TYPES.ForStatement: {
      return getEdgeOfStatement(block.body);
    }
    case AST_NODE_TYPES.Program: {
      return edges(block.body, block);
    }
    case AST_NODE_TYPES.SwitchStatement: {
      return edges(block.cases, block);
    }
    case AST_NODE_TYPES.WithStatement: {
      return getEdgeOfStatement(block.body);
    }
    default: {
      return [block, block];
    }
  }
}

function getEdgeOfStatement(
  statement: TSESTree.Node
): [TSESTree.Node, TSESTree.Node] {
  if (statement.type === AST_NODE_TYPES.BlockStatement) {
    return [
      first(statement.body) || statement,
      last(statement.body) || statement,
    ];
  }
  return [statement, statement];
}

function edges<T, U>(arr: readonly T[], defaultValue: U): [T | U, T | U] {
  return [first(arr) || defaultValue, last(arr) || defaultValue];
}

function first<T>(arr: readonly T[]): T | undefined {
  return arr[0];
}

function last<T>(arr: readonly T[]): T | undefined {
  return arr[arr.length - 1];
}
