import type { Types } from "@graphql-codegen/plugin-helpers";
import type {
  MockPresetConfig,
  MockPluginConfig,
  MockTestCasesConfig,
} from "../../types";
import path from "path";
import fs from "fs/promises";
import yaml from "js-yaml";
import dashify from "dashify";
import { filterQueriesByName } from '@/util/filter-queries-by-name';
import { DefinitionNode, DocumentNode } from 'graphql';
import { expandFragments } from '@/util/expand-fragments';

const preset: Types.OutputPreset<MockPresetConfig> = {
  async buildGeneratesSection(
    options: Types.PresetFnArgs<MockPresetConfig, MockPluginConfig>
  ) {
    const generates: Array<Types.GenerateOptions> = [];
    const {
      presetConfig: { splitByTestCase = true },
      documents,
      config,
    } = options;
    const partialGenerates: Partial<Types.GenerateOptions> = {
      plugins: options.plugins,
      schema: options.schema,
      schemaAst: options.schemaAst,
      config: options.config,
      pluginMap: options.pluginMap,
      pluginContext: options.pluginContext,
      profiler: options.profiler,
      cache: options.cache,
      documentTransforms: options.documentTransforms
    };

    if (!config?.testCases) throw new Error("No test cases specified.");

    let configsObj: MockTestCasesConfig;
    try {
      configsObj = yaml.load(
        await fs.readFile(config.testCases, { encoding: "utf-8" })
      ) as MockTestCasesConfig;
    } catch (err) {
      throw new Error("Failure while loading test cases.");
    }

    if (splitByTestCase) {
      Object.keys(configsObj).forEach((testCase) => {
        const filteredDocuments = documents
          .map((documentFile) => {
            const expandedDocument = expandFragments(documentFile.document);
            return <Types.DocumentFile>{
              ...documentFile,
              document: <DocumentNode>{
                ...documentFile.document,
                kind: "Document",
                definitions: Object.keys(configsObj[testCase]).reduce(
                  (acc: Array<DefinitionNode>, queryName) =>
                    acc.concat(
                      filterQueriesByName(expandedDocument, queryName)
                        ?.definitions ?? []
                    ),
                  []
                ),
              },
            };
          })
          .filter((documentFile) => documentFile.document?.definitions.length);
        generates.push(<Types.GenerateOptions>{
          ...partialGenerates,
          documents: filteredDocuments,
          filename: path.join(
            options.baseOutputDir,
            `${dashify(testCase)}.json`
          ),
        });
      });
    } else {
      const queryNames = new Set<string>();
      Object.values(configsObj).forEach((queries) => {
        Object.keys(queries).forEach((name) => queryNames.add(name));
      });
      queryNames.forEach((name) => {
        const filteredDocuments = documents
          .map((documentFile) => {
            const expandedDocument = expandFragments(documentFile.document);
            return {
              ...documentFile,
              document: filterQueriesByName(expandedDocument, name),
            };
          })
          .filter((documentFile) => documentFile.document?.definitions.length);
        generates.push(<Types.GenerateOptions>{
          ...partialGenerates,
          documents: filteredDocuments,
          filename: path.join(options.baseOutputDir, `${dashify(name)}.json`),
        });
      });
    }

    return generates;
  },
};

module.exports.default = preset;
