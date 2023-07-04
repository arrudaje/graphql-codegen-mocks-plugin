import { ASTNode } from "graphql/language/ast";
import { visit } from "graphql";
import { BREAK, FieldNode } from 'graphql/index';

export function deleteNode() {
  return null;
}

export const ignoreDefinitions: {
  [NodeT in ASTNode as NodeT["kind"]]?: () => null;
} = {
  OperationDefinition: deleteNode,
  FragmentDefinition: deleteNode,
  SchemaDefinition: deleteNode,
  OperationTypeDefinition: deleteNode,
  ScalarTypeDefinition: deleteNode,
  ObjectTypeDefinition: deleteNode,
  FieldDefinition: deleteNode,
  InputValueDefinition: deleteNode,
  InterfaceTypeDefinition: deleteNode,
  UnionTypeDefinition: deleteNode,
  EnumTypeDefinition: deleteNode,
  EnumValueDefinition: deleteNode,
  InputObjectTypeDefinition: deleteNode,
  DirectiveDefinition: deleteNode,
};

export const getOperationName = (tree: ASTNode) => {
  let queryName = "";
  visit(tree, {
    Field(node) {
      queryName = node.name.value;
      return BREAK;
    },
  });
  return queryName;
}

export const removeLoc = (tree: ASTNode) =>
  visit(tree, {
    enter(node) {
      return {
        ...node,
        loc: undefined,
      };
    },
  });

export const anonymizeOperations = (tree: ASTNode) =>
  visit(tree, {
    enter(node) {
      if ("alias" in node)
        return {
          ...node,
          alias: undefined,
        };
      return node;
    },
    OperationDefinition(node) {
      return {
        ...node,
        name: undefined,
      };
    },
  });
