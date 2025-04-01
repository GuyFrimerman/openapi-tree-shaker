# OpenAPI Tree Shaker

[![Tests Passing](../../actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)
[![Lint](../../actions/workflows/lint.yml/badge.svg)](../../actions/workflows/lint.yml)
[![npm version](https://badge.fury.io/js/openapi-tree-shaker.svg)](https://badge.fury.io/js/openapi-tree-shaker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A tool to tree-shake OpenAPI specifications by removing unused paths and components.

## Features

- Remove unused paths based on regex patterns
- Remove unused schemas, parameters, responses, and request bodies
- Support for both OpenAPI 2.0 and 3.0
- Web UI for interactive tree-shaking
- CLI tool for automation

## Installation

```bash
npm install openapi-tree-shaker
```

## Usage

### CLI

```bash
# Tree-shake all paths matching the pattern
openapi-tree-shake spec.json "^/api/v1/users"

# Keep all paths (no pattern)
openapi-tree-shake spec.json

# Multiple patterns
openapi-tree-shake spec.json "^/api/v1/users" "^/api/v1/posts"
```

### Web UI

1. Visit [https://openapi-tree-shaker.netlify.app](https://openapi-tree-shaker.netlify.app)
2. Import your OpenAPI specification
3. Select the paths you want to keep
4. Download the tree-shaken specification

### API

```typescript
import { treeShakeOpenAPI } from 'openapi-tree-shaker';

const spec = {
  // Your OpenAPI specification
};

const result = treeShakeOpenAPI(spec, ['^/api/v1/users']);
console.log(result.spec); // Tree-shaken specification
console.log(result.summary); // Summary of removed items
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT