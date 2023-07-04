export type MockPresetConfig = {
  splitByTestCase?: boolean;
  outputDirectory?: string;
};

export type MockPluginConfig = {
  testCases?: string;
  schema?: string;
};

export type MockTestCasesConfig = {
  [testCase: string]: {
    [queryName: string]: {
      variables: Record<string, any>;
    };
  };
};

export type MockResult = Record<string, Record<string, Record<string, any>>>;
