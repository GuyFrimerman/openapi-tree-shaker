import { describe, it, expect } from 'vitest';
import { validateOpenAPISpec } from '../validator';

describe('validateOpenAPISpec', () => {
  it('should validate a valid OpenAPI 3.0 specification', () => {
    const validSpec = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/test': {
          get: {
            responses: {
              '200': {
                description: 'OK',
              },
            },
          },
        },
      },
    };

    expect(() => validateOpenAPISpec(validSpec)).not.toThrow();
  });

  it('should throw error for invalid OpenAPI specification', () => {
    const invalidSpec = {
      openapi: '3.0.0',
      // Missing required 'info' field
      paths: {},
    };

    expect(() => validateOpenAPISpec(invalidSpec)).toThrow(
      'Invalid OpenAPI specification: Missing or invalid info object'
    );
  });

  it('should throw error for non-object input', () => {
    expect(() => validateOpenAPISpec('not an object')).toThrow(
      'Invalid OpenAPI specification: Input must be an object'
    );
    expect(() => validateOpenAPISpec(null)).toThrow(
      'Invalid OpenAPI specification: Input must be an object'
    );
    expect(() => validateOpenAPISpec(undefined)).toThrow(
      'Invalid OpenAPI specification: Input must be an object'
    );
  });

  it('should throw error for missing paths', () => {
    const invalidSpec = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      // Missing paths
    };

    expect(() => validateOpenAPISpec(invalidSpec)).toThrow(
      'Invalid OpenAPI specification: Missing or invalid paths object'
    );
  });

  it('should validate a specification with components', () => {
    const specWithComponents = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/test': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Test',
                    },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Test: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
            },
          },
        },
      },
    };

    expect(() => validateOpenAPISpec(specWithComponents)).not.toThrow();
  });

  it('should validate a valid OpenAPI 2.0 specification', () => {
    const validSpec = {
      swagger: '2.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/test': {
          get: {
            responses: {
              '200': {
                description: 'OK',
              },
            },
          },
        },
      },
    };

    expect(() => validateOpenAPISpec(validSpec)).not.toThrow();
  });
});
