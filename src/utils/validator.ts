import OpenAPISchemaValidator from 'openapi-schema-validator';
import type { OpenAPISpec } from '../types/openapi';
import type { OpenAPIV2, OpenAPIV3 } from 'openapi-types';

const validator3 = new OpenAPISchemaValidator({ version: 3 });
const validator2 = new OpenAPISchemaValidator({ version: 2 });

export function validateOpenAPISpec(spec: unknown): OpenAPISpec {
  if (!spec || typeof spec !== 'object') {
    throw new Error('Invalid OpenAPI specification: Input must be an object');
  }

  // Check for required fields
  const typedSpec = spec as Record<string, unknown>;

  if (!typedSpec.info || typeof typedSpec.info !== 'object') {
    throw new Error('Invalid OpenAPI specification: Missing or invalid info object');
  }

  if (!typedSpec.paths || typeof typedSpec.paths !== 'object') {
    throw new Error('Invalid OpenAPI specification: Missing or invalid paths object');
  }

  // Determine OpenAPI version
  const version = typedSpec.openapi ? 3 : typedSpec.swagger ? 2 : null;

  if (!version) {
    throw new Error('Invalid OpenAPI specification: Missing openapi or swagger version');
  }

  const validator = version === 3 ? validator3 : validator2;
  const validationResult = validator.validate(spec as OpenAPIV2.Document | OpenAPIV3.Document);

  if (validationResult.errors.length > 0) {
    const errorMessages = validationResult.errors
      .map(error => error.message)
      .join('\n');
    throw new Error(`Invalid OpenAPI specification:\n${errorMessages}`);
  }

  return spec as OpenAPISpec;
}
