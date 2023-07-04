import {
  type ASTNode,
  type FieldNode,
  type SelectionSetNode,
  Kind,
  OperationDefinitionNode,
} from "graphql";
import { mergeWith, keyBy, at, isNil } from "lodash";
import { anonymizeOperations, removeLoc } from './util';
import {
  ConstDirectiveNode,
  DirectiveNode,
  DocumentNode,
  VariableDefinitionNode,
} from "graphql/language/ast";

type BranchParent = DocumentNode &
  OperationDefinitionNode &
  VariableDefinitionNode &
  FieldNode &
  SelectionSetNode &
  DirectiveNode &
  ConstDirectiveNode;

// properties that potentially could have the ASTNode branch
// off to N children (Arrays of ASTNode - only the relevant
// ones for dealing with operations)
const branchableProperties = [
  "definitions",
  "variableDefinitions",
  "directives",
  "selections",
  "arguments",
  "selectionSet",
] as const;

// the properties that identify each node kind individually
const nodeIdentity: { [key in Kind]?: Array<string> } = {
  [Kind.OPERATION_DEFINITION]: ["kind", "name.value"],
  [Kind.VARIABLE_DEFINITION]: ["kind", "variable.name.value"],
  [Kind.FIELD]: ["kind", "name.value"],
  [Kind.DIRECTIVE]: ["kind", "name.value"],
  [Kind.ARGUMENT]: ["kind", "name.value"],
};

const getNodeIdentity = (node: ASTNode) =>
  // @ts-ignore
  at(node, nodeIdentity[node.kind] ?? []).join(".") ?? "*";

const hasSelectionSet = (
  node: ASTNode
): node is OperationDefinitionNode | FieldNode =>
  "selectionSet" in node && Boolean(node.selectionSet);

const isBranch = (node: ASTNode, property: string): node is BranchParent => {
  const branch = node[property as keyof ASTNode];
  return (
    !isNil(branch) &&
    ((Array.isArray(branch) && Boolean(branch.length)) ||
      (hasSelectionSet(node) && property === "selectionSet"))
  );
};

const isParentNode = (node: ASTNode) =>
  node &&
  (branchableProperties.some((p) => {
    const branch = node[p as keyof ASTNode];
    return Array.isArray(branch) && branch.length;
  }) ||
    // selectionSet is a special case that can be undefined in FieldNode
    // - and that otherwise makes it a parent node (even without any other
    // "branchable" properties!)
    hasSelectionSet(node));

/**
 * Merges two AST nodes, based on their children. It is assumed
 * that both roots are of the same type and have the same name.
 * @param {ASTNode} origin
 * @param {ASTNode} source
 * @returns {ASTNode}
 */
function merge(origin: ASTNode, source: ASTNode): ASTNode {
  // if they're both not parent nodes, assuming that both are of
  // the same type and have the same name, they could be identical
  // as far as we care about. Returning the source just because.
  if (!isParentNode(origin) && !isParentNode(source)) return source;
  // if, on the other hand, one of the two is a parent node, there are
  // some goodies we're missing on the other side, so we return the
  // parent one.
  if (isParentNode(origin) && !isParentNode(source)) return origin;
  if (!isParentNode(origin) && isParentNode(source)) return source;
  // if both are parents, we need to start visiting them "in parallel".
  const filteredProperties = branchableProperties.filter(
    (property) => isBranch(origin, property) || isBranch(source, property)
  );
  return filteredProperties.reduce((result, property) => {
    if (isBranch(origin, property) && isBranch(source, property)) {
      const mappedOriginBranch = keyBy(
        property === "selectionSet" ? [origin[property]] : origin[property],
        getNodeIdentity
      );
      const mappedSourceBranch = keyBy(
        property === "selectionSet" ? [source[property]] : source[property],
        getNodeIdentity
      );
      const mergedBranches = Object.values(
        mergeWith(mappedOriginBranch, mappedSourceBranch, merge)
      );
      // @ts-ignore
      result[property] = property === "selectionSet" ? mergedBranches[0] : mergedBranches;
    } else if (isBranch(origin, property)) {
      // @ts-ignore
      result[property] = origin[property];
    } else {
      // @ts-ignore
      result[property] = source[property];
    }
    return result;
  }, origin);
}

export function mergeOperations(operations: Array<ASTNode>) {
  const [firstOperation, ...restOperations] = operations;
  let aggregate = removeLoc(firstOperation);
  aggregate = restOperations.reduce(
    (agg, op) => merge(agg, removeLoc(op)),
    aggregate
  );
  return anonymizeOperations(aggregate);
}
