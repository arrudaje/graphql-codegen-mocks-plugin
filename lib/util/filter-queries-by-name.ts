import { DocumentNode, FragmentDefinitionNode, FragmentSpreadNode, OperationDefinitionNode } from "graphql";
import { visit } from "graphql";
import { deleteNode, ignoreDefinitions } from './util';

export function filterQueriesByName(
  document?: DocumentNode,
  queryName?: string
): DocumentNode | undefined {
  if (!document) return;

  const fragmentsToInclude: Array<string> = [];
  const filteredQueries = visit(document, {
    // ignore the rest of the definitions as they do not define queries
    ...ignoreDefinitions,
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
    FragmentSpread(node: FragmentSpreadNode) {
        fragmentsToInclude.push(node.name.value);
    },
  });

  // include only the fragments that were requested by the specified query, if any
  const filteredFragments = visit(document, {
    // ignore the rest of the definitions as they do not define fragments
    ...ignoreDefinitions,
    FragmentDefinition(node: FragmentDefinitionNode) {
        if (!fragmentsToInclude.includes(node.name.value)) return null;
    },
  });

  return {
    ...filteredQueries,
    definitions: [...filteredQueries.definitions, ...(filteredFragments.definitions || [])],
  };
}
