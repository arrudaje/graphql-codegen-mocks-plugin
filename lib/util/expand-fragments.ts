import {
  DocumentNode,
  FragmentDefinitionNode,
  FragmentSpreadNode,
  SelectionSetNode,
  visit,
} from "graphql";
import { deleteNode, ignoreDefinitions } from './util';

export function expandFragments(
  document?: DocumentNode
): DocumentNode | undefined {
  if (!document) return;

  return visit(document, {
    SelectionSet(selectionSetNode: SelectionSetNode) {
        const selection = visit(selectionSetNode, {
            FragmentSpread(fragmentSpreadNode: FragmentSpreadNode) {
              return visit(document, {
                // ignore the rest of the definitions as they do not define fragments
                ...ignoreDefinitions,
                FragmentDefinition(fragmentDefinitionNode: FragmentDefinitionNode) {
                  return fragmentDefinitionNode.name.value ===
                    fragmentSpreadNode.name.value
                    ? fragmentDefinitionNode.selectionSet.selections
                    : null;
                },
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
