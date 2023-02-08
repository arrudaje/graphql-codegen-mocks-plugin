export type MockPresetConfig = {
    splitByTestCase: boolean,
    outputDirectory: string,
}

export type MockPluginConfig = {
    testCases?: string,
}

export type MockTestCasesConfig = {
    [testCase: string]: {
        [queryName: string]: {
            variables: Record<string, any>,
        }
    }
}