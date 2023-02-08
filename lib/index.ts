import type { CodegenPlugin } from '@graphql-codegen/plugin-helpers';
import fs from 'fs/promises';

const config: CodegenPlugin = {
    async plugin(schema, documents, config, info) {
        if (info?.outputFile) {
            let fileExists = true;
            try {
                await fs.access(info.outputFile, fs.constants.F_OK);
            } catch {
                fileExists = false;
            }
            
            if (fileExists) {
                const output = await fs.readFile(info.outputFile, { encoding: 'utf-8' });
                return output + 'hi.';
            }
            return JSON.stringify(documents);
        }
        throw new Error('Please specify output file path.');
    },
};

module.exports = config;
