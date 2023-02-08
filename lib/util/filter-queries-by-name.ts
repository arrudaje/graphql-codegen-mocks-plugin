import { ASTNode, DocumentNode, FragmentDefinitionNode, FragmentSpreadNode, OperationDefinitionNode } from "graphql";
import { visit } from "graphql";

function deleteNode() {
  return null;
}

export function filterQueriesByName(
  document?: DocumentNode,
  queryName?: string
): DocumentNode | undefined {
  if (!document) return;

  const fragmentsToInclude: Array<string> = [];
  const filteredQueries = visit(document, {
    OperationDefinition: {
      enter(
        operationNode: OperationDefinitionNode,
        operationKey,
        operationParent,
        operationAncestors
      ) {
        if (operationNode.operation === "query") {
          const matchingFields: OperationDefinitionNode = visit(operationNode, {
            Field(fieldNode, fieldKey, fieldParent, fieldAncestors) {
              if (
                fieldNode.name.value !== queryName &&
                fieldAncestors.length === operationAncestors.length + 1
              )
                return null;
            },
          });

          if (matchingFields.selectionSet.selections.length)
            return matchingFields;
        }

        return null;
      },
    },
    FragmentSpread(node: FragmentSpreadNode){
        fragmentsToInclude.push(node.name.value);
    },
    // ignore the rest of the definitions as they do not define queries
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
  });

  // include only the fragments that were requested by the specified query, if any
  const filteredFragments = visit(document, {
    FragmentDefinition(node: FragmentDefinitionNode) {
        if (!fragmentsToInclude.includes(node.name.value)) return null;
    },
    // ignore the rest of the definitions as they do not define fragments
    OperationDefinition: deleteNode,
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
  });

  filteredQueries.definitions.push(...(filteredFragments.definitions || []));

  return filteredQueries;
}
