#!/usr/bin/env node

import { readFileSync } from 'fs';
import { treeShakeOpenAPI } from './lib/tree-shaker.js';
import { validateOpenAPISpec } from './utils/validator.js';

if (process.argv.length < 3) {
  console.error('Usage: openapi-tree-shake <openapi.json> [pattern1 pattern2 ...]');
  process.exit(1);
}

const [, , specPath, ...patterns] = process.argv;

try {
  const spec = JSON.parse(readFileSync(specPath, 'utf-8'));
  const validatedSpec = validateOpenAPISpec(spec);
  const result = treeShakeOpenAPI(validatedSpec, patterns.length > 0 ? patterns : undefined);
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error('Error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
}
