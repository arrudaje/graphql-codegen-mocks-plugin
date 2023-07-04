import { mergeOperations } from './merge-operations';
import operations from '@/test/operations.json';
import { FieldNode, OperationDefinitionNode } from 'graphql';

describe('mergeOperations', () => {
  it('should merge two operations into one', () => {
    const merged = mergeOperations([ operations[0] as unknown as OperationDefinitionNode, operations[1] as unknown as OperationDefinitionNode ]);
    expect(merged).toHaveProperty('kind', 'OperationDefinition');
    const operation = merged as OperationDefinitionNode;
    const experimentInstanceDetails = operation.selectionSet.selections[0] as FieldNode;
    expect(experimentInstanceDetails.name.value).toBe('experimentInstanceDetails');
    expect(experimentInstanceDetails.selectionSet?.selections.length).toBe(5);
  });

  it('should merge many operations into one', () => {
    const merged = mergeOperations(operations as unknown as Array<OperationDefinitionNode>);
    expect(merged).toHaveProperty('kind', 'OperationDefinition');
    const operation = merged as OperationDefinitionNode;
    const experimentInstanceDetails = operation.selectionSet.selections[0] as FieldNode;
    expect(experimentInstanceDetails.name.value).toBe('experimentInstanceDetails');
    expect(experimentInstanceDetails.selectionSet?.selections.length).toBe(96);
  });
});
