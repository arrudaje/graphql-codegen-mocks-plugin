import { type CodegenPlugin } from "@graphql-codegen/plugin-helpers";
import fs from "fs/promises";
import { constants } from "fs";
import path from "path";
import { type MockPluginConfig, MockResult, type MockTestCasesConfig } from '../types';
import yaml from "js-yaml";
import { operationNamesPerDocument } from "./util/operation-names-per-document";
import { type ASTNode, type DefinitionNode, type DocumentNode } from "graphql";
import { filterQueriesByName } from "./util/filter-queries-by-name";
import { mergeOperations } from "./util/merge-operations";
import { mapValues, reduce } from "lodash";
import { print } from "graphql/language/printer";
import { getOperationName } from "@/util/util";

const getMockIdentity = (mockConfig: MockTestCasesConfig[string][string]) =>
  Object.values(mockConfig.variables).join(".");

const generateRequest = (
  node: ASTNode,
  testCase: MockTestCasesConfig[string]
) => {
  const queryDSL = print(node);
  const queryName = getOperationName(node);
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: queryDSL,
      variables: testCase[queryName].variables,
    }),
  };
};

const config: CodegenPlugin<MockPluginConfig> = {
  async plugin(schema, documents, config, info) {
    if (info?.outputFile) {
      const filePath = path.join(process.cwd(), info.outputFile);
      let fileExists = true;
      try {
        await fs.access(filePath, constants.F_OK);
      } catch (err) {
        fileExists = false;
      }

      const documentNodes = documents
        .filter((doc) => doc.document)
        .map((doc) => doc.document) as Array<DocumentNode>;

      const operationsMap = Array.from(
        new Set(documentNodes.map(operationNamesPerDocument).flat())
      ).reduce<Record<string, Array<DefinitionNode>>>((acc, cur) => {
        const nodes = documentNodes.reduce(
          (operationDefinitions: Array<DefinitionNode>, documentNode) =>
            operationDefinitions.concat(
              filterQueriesByName(documentNode, cur)?.definitions ?? []
            ),
          []
        );
        nodes && (acc[cur] = nodes);
        return acc;
      }, {});

      const mergedOperations = mapValues(operationsMap, mergeOperations);

      if (!config?.testCases) throw new Error("No test cases specified.");
      let testCases: MockTestCasesConfig;
      try {
        testCases = yaml.load(
          await fs.readFile(config.testCases, { encoding: "utf-8" })
        ) as MockTestCasesConfig;
      } catch (err) {
        throw new Error("Failure while loading test cases.");
      }

      const url = config?.schema;
      if (!url) throw new Error("No schema URL specified.");
      if (fileExists) {
        const output = await fs.readFile(filePath, { encoding: "utf-8" });
        return "hi." + output;
      }
      const mockResults = mapValues(mergedOperations, (operation) =>
        reduce(
          testCases,
          async (acc, testCase) => {
            const response = await fetch(
              url,
              generateRequest(operation, testCase)
            );
            const mock = await response.json();
            const operationName = getOperationName(operation);
            // @ts-ignore
            acc[operationName][getMockIdentity(testCase[operationName])] = mock;
            return acc;
          },
          {}
        )
      );

      return JSON.stringify(mockResults);
    }
    throw new Error("Please specify output file path.");
  },
};

module.exports = config;
