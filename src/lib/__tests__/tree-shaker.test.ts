import { describe, it, expect } from 'vitest';
import { treeShakeOpenAPI } from '../tree-shaker';
import { validateOpenAPISpec } from '../../utils/validator';
import type { OpenAPISpec } from '../../types/openapi';

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
    const spec: OpenAPISpec = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0'
      },
      paths: {
        '/users': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/User'
                    }
                  }
                }
              }
            }
          }
        }
      },
      components: {
        schemas: {
          User: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              friends: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/User' // Circular reference
                }
              }
            }
          },
          Post: {
            type: 'object',
            properties: {
              title: { type: 'string' }
            }
          }
        }
      }
    };

    const result = treeShakeOpenAPI(spec, ['^/users']);
    
    // Should keep the User schema despite circular reference
    expect(Object.keys(result.spec.components!.schemas!)).toEqual(['User']);
    expect(result.summary.removedSchemas).toEqual(['Post']);
    
    // Verify the circular reference is preserved
    const userSchema = result.spec.components!.schemas!.User;
    expect(userSchema.properties.friends.items.$ref).toBe('#/components/schemas/User');
    
    // Validate output schema
    expect(() => validateOpenAPISpec(result.spec)).not.toThrow();
  });

  it('should handle deeply nested circular references and output valid OpenAPI', () => {
    const spec: OpenAPISpec = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0'
      },
      paths: {
        '/categories': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Category'
                    }
                  }
                }
              }
            }
          }
        }
      },
      components: {
        schemas: {
          Category: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              subcategories: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Category' // Direct circular reference
                }
              },
              products: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Product'
                }
              }
            }
          },
          Product: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: {
                $ref: '#/components/schemas/Category' // Indirect circular reference
              }
            }
          },
          Unused: {
            type: 'object',
            properties: {
              data: { type: 'string' }
            }
          }
        }
      }
    };

    const result = treeShakeOpenAPI(spec, ['^/categories']);
    
    // Should keep both Category and Product schemas due to mutual references
    expect(Object.keys(result.spec.components!.schemas!).sort())
      .toEqual(['Category', 'Product'].sort());
    
    // Should remove unused schemas
    expect(result.summary.removedSchemas).toEqual(['Unused']);
    
    // Verify circular references are preserved
    const categorySchema = result.spec.components!.schemas!.Category;
    const productSchema = result.spec.components!.schemas!.Product;
    
    expect(categorySchema.properties.subcategories.items.$ref)
      .toBe('#/components/schemas/Category');
    expect(categorySchema.properties.products.items.$ref)
      .toBe('#/components/schemas/Product');
    expect(productSchema.properties.category.$ref)
      .toBe('#/components/schemas/Category');
    
    // Validate output schema
    expect(() => validateOpenAPISpec(result.spec)).not.toThrow();
  });

  it('should handle OpenAPI 2.0 circular references and output valid OpenAPI', () => {
    const spec: OpenAPISpec = {
      swagger: '2.0',
      info: {
        title: 'Test API',
        version: '1.0.0'
      },
      paths: {
        '/nodes': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                schema: {
                  $ref: '#/definitions/Node'
                }
              }
            }
          }
        }
      },
      definitions: {
        Node: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            parent: {
              $ref: '#/definitions/Node' // Self-reference
            },
            children: {
              type: 'array',
              items: {
                $ref: '#/definitions/Node' // Array of self-references
              }
            }
          }
        },
        Unused: {
          type: 'object',
          properties: {
            data: { type: 'string' }
          }
        }
      }
    };

    const result = treeShakeOpenAPI(spec, ['^/nodes']);
    
    // Should keep Node schema despite circular references
    expect(Object.keys(result.spec.definitions!)).toEqual(['Node']);
    expect(result.summary.removedSchemas).toEqual(['Unused']);
    
    // Verify circular references are preserved
    const nodeSchema = result.spec.definitions!.Node;
    expect(nodeSchema.properties.parent.$ref).toBe('#/definitions/Node');
    expect(nodeSchema.properties.children.items.$ref).toBe('#/definitions/Node');
    
    // Validate output schema
    expect(() => validateOpenAPISpec(result.spec)).not.toThrow();
  });
});