import { describe, it, expect } from 'vitest';
import { treeShakeOpenAPI } from '../tree-shaker';
import { validateOpenAPISpec } from '../../utils/validator';
import type { OpenAPISpec } from '../../types/openapi';

describe('treeShakeOpenAPI', () => {
  describe('OpenAPI 2.0 Security', () => {
    it('should preserve used security definitions', () => {
      const spec: OpenAPISpec = {
        swagger: '2.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {
          '/secure': {
            get: {
              security: [{ apiKey: [] }],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
        securityDefinitions: {
          apiKey: {
            type: 'apiKey',
            name: 'api_key',
            in: 'header',
          },
          unused: {
            type: 'basic',
          },
        },
      };

      const result = treeShakeOpenAPI(spec);
      expect(Object.keys(result.spec.securityDefinitions!)).toEqual(['apiKey']);
      expect(result.summary.removedSecuritySchemes).toEqual(['unused']);
      expect(() => validateOpenAPISpec(result.spec)).not.toThrow();
    });

    it('should handle global security requirements', () => {
      const spec: OpenAPISpec = {
        swagger: '2.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        security: [{ globalAuth: [] }],
        paths: {
          '/test': {
            get: {
              responses: { '200': { description: 'OK' } },
            },
          },
        },
        securityDefinitions: {
          globalAuth: {
            type: 'oauth2',
            flow: 'implicit',
            authorizationUrl: 'https://example.com/auth',
          },
          unused: {
            type: 'basic',
          },
        },
      };

      const result = treeShakeOpenAPI(spec);
      expect(Object.keys(result.spec.securityDefinitions!)).toEqual(['globalAuth']);
      expect(result.summary.removedSecuritySchemes).toEqual(['unused']);
      expect(() => validateOpenAPISpec(result.spec)).not.toThrow();
    });
  });

  describe('OpenAPI 3.0 Security', () => {
    it('should preserve used security schemes', () => {
      const spec: OpenAPISpec = {
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {
          '/secure': {
            get: {
              security: [{ bearerAuth: [] }],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
            },
            unused: {
              type: 'apiKey',
              name: 'api_key',
              in: 'header',
            },
          },
        },
      };

      const result = treeShakeOpenAPI(spec);
      expect(Object.keys(result.spec.components!.securitySchemes!)).toEqual(['bearerAuth']);
      expect(result.summary.removedSecuritySchemes).toEqual(['unused']);
      expect(() => validateOpenAPISpec(result.spec)).not.toThrow();
    });

    it('should handle multiple security requirements', () => {
      const spec: OpenAPISpec = {
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {
          '/secure': {
            get: {
              security: [{ bearerAuth: [] }, { apiKey: [] }],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
            },
            apiKey: {
              type: 'apiKey',
              name: 'api_key',
              in: 'header',
            },
            unused: {
              type: 'http',
              scheme: 'basic',
            },
          },
        },
      };

      const result = treeShakeOpenAPI(spec);
      expect(Object.keys(result.spec.components!.securitySchemes!).sort()).toEqual(
        ['apiKey', 'bearerAuth'].sort()
      );
      expect(result.summary.removedSecuritySchemes).toEqual(['unused']);
      expect(() => validateOpenAPISpec(result.spec)).not.toThrow();
    });

    it('should handle global and operation-level security', () => {
      const spec: OpenAPISpec = {
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        security: [{ globalAuth: [] }],
        paths: {
          '/secure': {
            get: {
              security: [{ localAuth: [] }],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
        components: {
          securitySchemes: {
            globalAuth: {
              type: 'http',
              scheme: 'bearer',
            },
            localAuth: {
              type: 'apiKey',
              name: 'api_key',
              in: 'header',
            },
            unused: {
              type: 'http',
              scheme: 'basic',
            },
          },
        },
      };

      const result = treeShakeOpenAPI(spec);
      expect(Object.keys(result.spec.components!.securitySchemes!).sort()).toEqual(
        ['globalAuth', 'localAuth'].sort()
      );
      expect(result.summary.removedSecuritySchemes).toEqual(['unused']);
      expect(() => validateOpenAPISpec(result.spec)).not.toThrow();
    });
  });
});
