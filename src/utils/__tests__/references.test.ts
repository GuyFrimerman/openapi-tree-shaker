import { describe, it, expect } from 'vitest';
import { treeShakeOpenAPI } from '../../lib/tree-shaker';
import { validateOpenAPISpec } from '../../utils/validator';
import { findReferencesInObject } from '../references';
import type { OpenAPISpec, SchemaObject } from '../../types/openapi';

describe('treeShakeOpenAPI', () => {
  it('should keep all paths when no patterns are provided and output valid OpenAPI', () => {
    const spec: OpenAPISpec = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0'
      },
      paths: {
        '/users': { get: { responses: { '200': { description: 'OK' } } } },
        '/posts': { get: { responses: { '200': { description: 'OK' } } } }
      }
    };

    const result = treeShakeOpenAPI(spec);
    expect(Object.keys(result.spec.paths)).toEqual(['/users', '/posts']);
    expect(result.summary.removedPaths).toEqual([]);
    
    // Validate output schema
    expect(() => validateOpenAPISpec(result.spec)).not.toThrow();
  });

  it('should filter paths based on patterns and output valid OpenAPI', () => {
    const spec: OpenAPISpec = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0'
      },
      paths: {
        '/users': { get: { responses: { '200': { description: 'OK' } } } },
        '/posts': { get: { responses: { '200': { description: 'OK' } } } }
      }
    };

    const result = treeShakeOpenAPI(spec, ['^/users']);
    expect(Object.keys(result.spec.paths)).toEqual(['/users']);
    expect(result.summary.removedPaths).toEqual(['/posts']);
    
    // Validate output schema
    expect(() => validateOpenAPISpec(result.spec)).not.toThrow();
  });

  it('should handle circular references in schemas and output valid OpenAPI', () => {
    const circular: SchemaObject = {
      type: 'object',
      properties: {
        self: { $ref: '#/components/schemas/Circular' }
      }
    };

    const refs = new Set();
    findReferencesInObject(circular, refs);

    expect(Array.from(refs)).toEqual([
      { type: 'schemas', name: 'Circular' }
    ]);
  });

  it('should handle nested circular references', () => {
    const obj: SchemaObject = {
      type: 'object',
      properties: {
        child: {
          type: 'object',
          properties: {
            parent: { $ref: '#/components/schemas/Parent' }
          }
        }
      }
    };

    // Create circular reference
    obj.properties.child.properties.deepChild = obj;

    const refs = new Set();
    findReferencesInObject(obj, refs);

    expect(Array.from(refs)).toEqual([
      { type: 'schemas', name: 'Parent' }
    ]);
  });

  it('should handle array circular references', () => {
    const obj: SchemaObject = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { $ref: '#/components/schemas/Item' }
        }
      }
    };

    // Create circular reference in array
    obj.properties.items.examples = [obj];

    const refs = new Set();
    findReferencesInObject(obj, refs);

    expect(Array.from(refs)).toEqual([
      { type: 'schemas', name: 'Item' }
    ]);
  });
});