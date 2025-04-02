import { describe, it, expect } from 'vitest';
import { findReferencesInObject, parseRef } from '../references';
import type { OpenAPISpec, SchemaObject } from '../../types/openapi';

describe('references utils', () => {
  describe('parseRef', () => {
    it('should parse OpenAPI 2.0 schema references', () => {
      const ref = parseRef('#/definitions/User');
      expect(ref).toEqual({ type: 'schemas', name: 'User' });
    });

    it('should parse OpenAPI 2.0 security references', () => {
      const ref = parseRef('#/securityDefinitions/apiKey');
      expect(ref).toEqual({ type: 'securitySchemes', name: 'apiKey' });
    });

    it('should parse OpenAPI 3.0 schema references', () => {
      const ref = parseRef('#/components/schemas/User');
      expect(ref).toEqual({ type: 'schemas', name: 'User' });
    });

    it('should parse OpenAPI 3.0 security references', () => {
      const ref = parseRef('#/components/securitySchemes/bearerAuth');
      expect(ref).toEqual({ type: 'securitySchemes', name: 'bearerAuth' });
    });

    it('should return null for invalid references', () => {
      expect(parseRef('#/invalid/path')).toBeNull();
      expect(parseRef('not-a-ref')).toBeNull();
      expect(parseRef('#/components/unknown/test')).toBeNull();
    });
  });

  describe('findReferencesInObject', () => {
    it('should find security requirements in OpenAPI 2.0', () => {
      const spec: Partial<OpenAPISpec> = {
        paths: {
          '/test': {
            get: {
              security: [{ apiKey: [] }, { oauth2: ['read'] }],
            },
          },
        },
      };

      const refs = new Set();
      findReferencesInObject(spec, refs);

      expect(Array.from(refs)).toEqual([
        { type: 'securitySchemes', name: 'apiKey' },
        { type: 'securitySchemes', name: 'oauth2' },
      ]);
    });

    it('should find security requirements in OpenAPI 3.0', () => {
      const spec: Partial<OpenAPISpec> = {
        paths: {
          '/test': {
            get: {
              security: [{ bearerAuth: [] }, { apiKey: [] }],
            },
          },
        },
      };

      const refs = new Set();
      findReferencesInObject(spec, refs);

      expect(Array.from(refs)).toEqual([
        { type: 'securitySchemes', name: 'bearerAuth' },
        { type: 'securitySchemes', name: 'apiKey' },
      ]);
    });

    it('should find global security requirements', () => {
      const spec: Partial<OpenAPISpec> = {
        security: [{ globalAuth: [] }],
      };

      const refs = new Set();
      findReferencesInObject(spec, refs);

      expect(Array.from(refs)).toEqual([{ type: 'securitySchemes', name: 'globalAuth' }]);
    });

    it('should handle circular references in security schemes', () => {
      const circular: SchemaObject = {
        type: 'object',
        properties: {
          auth: { $ref: '#/components/securitySchemes/auth' },
        },
      };

      const refs = new Set();
      findReferencesInObject(circular, refs);

      expect(Array.from(refs)).toEqual([{ type: 'securitySchemes', name: 'auth' }]);
    });

    it('should handle nested security requirements', () => {
      const spec: Partial<OpenAPISpec> = {
        paths: {
          '/test': {
            get: {
              security: [{ outer: [] }],
              responses: {
                '200': {
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          inner: {
                            security: [{ inner: [] }],
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };

      const refs = new Set();
      findReferencesInObject(spec, refs);

      expect(Array.from(refs)).toEqual([
        { type: 'securitySchemes', name: 'outer' },
        { type: 'securitySchemes', name: 'inner' },
      ]);
    });
  });
});
