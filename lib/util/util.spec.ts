import operations from '@/test/operations.json';
import { anonymizeOperations, removeLoc } from '@/util/util';
import { FieldNode, OperationDefinitionNode } from 'graphql/index';

describe('removeLoc', () => {
  it('should remove all location annotations from the AST', () => {
    const locationRemoved = removeLoc(operations[0] as unknown as OperationDefinitionNode);
    const operation = locationRemoved as OperationDefinitionNode;
    const experimentInstanceDetails = operation.selectionSet.selections[0] as FieldNode;
    expect(experimentInstanceDetails.loc).toBeUndefined();
  });
});

describe('anonymizeOperations', () => {
  it('should remove all operation names and aliases from the AST', () => {
    const anonymized = anonymizeOperations(operations[37] as unknown as OperationDefinitionNode);
    const operation = anonymized as OperationDefinitionNode;
    const experimentInstanceDetails = operation.selectionSet.selections[0] as FieldNode;
    expect(experimentInstanceDetails.name).toBeUndefined();
    const primary = experimentInstanceDetails.selectionSet?.selections[6] as FieldNode;
    expect(primary.alias).toBeUndefined();
  });
});
