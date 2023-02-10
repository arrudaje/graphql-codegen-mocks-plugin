import {
  DocumentNode,
  FragmentDefinitionNode,
  FragmentSpreadNode,
  SelectionSetNode,
  visit,
} from "graphql";

function deleteNode() {
  return null;
}

export function expandFragments(
  document?: DocumentNode
): DocumentNode | undefined {
  if (!document) return;

  return visit(document, {
    SelectionSet(selectionSetNode: SelectionSetNode) {
        const selection = visit(selectionSetNode, {
            FragmentSpread(fragmentSpreadNode: FragmentSpreadNode) {
              return visit(document, {
                FragmentDefinition(fragmentDefinitionNode: FragmentDefinitionNode) {
                  return fragmentDefinitionNode.name.value ===
                    fragmentSpreadNode.name.value
                    ? fragmentDefinitionNode.selectionSet.selections
                    : null;
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
              }).definitions;
            },
          });
      return {
        ...selectionSetNode,
        // depending on the depth that the fragment spread appears, the array 
        // may be returned with N levels deep, we can just completely flatten it
        selections: selection.selections.flat(Infinity),
      };
    },
    FragmentDefinition: {
      enter: deleteNode,
    },
  });
}
