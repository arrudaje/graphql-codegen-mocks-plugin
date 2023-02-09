import type { CodegenPlugin } from '@graphql-codegen/plugin-helpers';
import fs from 'fs/promises';
import { constants } from 'fs';
import path from 'path';

const config: CodegenPlugin = {
    async plugin(schema, documents, config, info) {
    
        if (info?.outputFile) {
            const filePath = path.join(process.cwd(), info.outputFile);
            let fileExists = true;
            try {
                await fs.access(filePath, constants.F_OK);
            } catch (err) {
                fileExists = false;
            }
            
            if (fileExists) {
                const output = await fs.readFile(filePath, { encoding: 'utf-8' });
                return 'hi.' + output;
            }
            return JSON.stringify(documents);
        }
        throw new Error('Please specify output file path.');
    },
};

module.exports = config;
