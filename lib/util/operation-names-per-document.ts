import { DocumentNode, FieldNode, OperationDefinitionNode, visit } from 'graphql';

export function operationNamesPerDocument(document: DocumentNode): Array<string> {
  const names = visit(document, {
    OperationDefinition(operationNode: OperationDefinitionNode) {
      return (operationNode.selectionSet.selections[0] as FieldNode).name?.value;
    }
  });
  return names.definitions as unknown as Array<string>;
}
