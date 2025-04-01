import { describe, it, expect } from 'vitest';
import { parseRef, findReferencesInObject, findAllReferences } from '../references';
import type { OpenAPISpec } from '../../types/openapi';

describe('parseRef', () => {
  it('should parse OpenAPI 2.0 references', () => {
    expect(parseRef('#/definitions/User')).toEqual({
      type: 'schemas',
      name: 'User'
    });
  });

  it('should parse OpenAPI 3.0 references', () => {
    expect(parseRef('#/components/schemas/User')).toEqual({
      type: 'schemas',
      name: 'User'
    });

    expect(parseRef('#/components/parameters/limit')).toEqual({
      type: 'parameters',
      name: 'limit'
    });

    expect(parseRef('#/components/responses/Success')).toEqual({
      type: 'responses',
      name: 'Success'
    });

    expect(parseRef('#/components/requestBodies/UserBody')).toEqual({
      type: 'requestBodies',
      name: 'UserBody'
    });
  });

  it('should return null for invalid references', () => {
    expect(parseRef('#/invalid/path')).toBeNull();
    expect(parseRef('#/components/invalid/User')).toBeNull();
    expect(parseRef('not-a-ref')).toBeNull();
  });
});

describe('findReferencesInObject', () => {
  it('should find all references in an object', () => {
    const obj = {
      schema: {
        $ref: '#/components/schemas/User'
      },
      parameters: [
        { $ref: '#/components/parameters/limit' }
      ],
      responses: {
        '200': {
          $ref: '#/components/responses/Success'
        }
      }
    };

    const refs = new Set();
    findReferencesInObject(obj, refs);

    expect(Array.from(refs)).toEqual([
      { type: 'schemas', name: 'User' },
      { type: 'parameters', name: 'limit' },
      { type: 'responses', name: 'Success' }
    ]);
  });

  it('should handle direct circular references', () => {
    const circular: any = {
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
    const obj: any = {
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
    const obj: any = {
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

describe('findAllReferences', () => {
  it('should find all references including nested ones', () => {
    const spec: OpenAPISpec = {
      paths: {
        '/users': {
          get: {
            responses: {
              '200': {
                $ref: '#/components/responses/UserResponse'
              }
            }
          }
        }
      },
      components: {
        responses: {
          UserResponse: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' }
              }
            }
          }
        },
        schemas: {
          User: {
            type: 'object',
            properties: {
              address: { $ref: '#/components/schemas/Address' }
            }
          },
          Address: {
            type: 'object'
          }
        }
      }
    };

    const refs = findAllReferences(spec, spec.paths);
    const refArray = Array.from(refs);
    const refNames = refArray.map(ref => ref.name).sort();

    expect(refNames).toEqual(['Address', 'User', 'UserResponse'].sort());
  });

  it('should handle circular references in components', () => {
    const spec: OpenAPISpec = {
      paths: {
        '/categories': {
          get: {
            responses: {
              '200': {
                $ref: '#/components/schemas/Category'
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
              parent: { $ref: '#/components/schemas/Category' },
              subcategories: {
                type: 'array',
                items: { $ref: '#/components/schemas/Category' }
              }
            }
          }
        }
      }
    };

    const refs = findAllReferences(spec, spec.paths);
    const refArray = Array.from(refs);
    const refNames = refArray.map(ref => ref.name).sort();

    expect(refNames).toEqual(['Category']);
  });

  it('should handle complex circular reference chains', () => {
    const spec: OpenAPISpec = {
      paths: {
        '/organizations': {
          get: {
            responses: {
              '200': {
                $ref: '#/components/schemas/Organization'
              }
            }
          }
        }
      },
      components: {
        schemas: {
          Organization: {
            type: 'object',
            properties: {
              departments: {
                type: 'array',
                items: { $ref: '#/components/schemas/Department' }
              }
            }
          },
          Department: {
            type: 'object',
            properties: {
              employees: {
                type: 'array',
                items: { $ref: '#/components/schemas/Employee' }
              }
            }
          },
          Employee: {
            type: 'object',
            properties: {
              organization: { $ref: '#/components/schemas/Organization' }
            }
          }
        }
      }
    };

    const refs = findAllReferences(spec, spec.paths);
    const refArray = Array.from(refs);
    const refNames = refArray.map(ref => ref.name).sort();

    expect(refNames).toEqual(['Department', 'Employee', 'Organization'].sort());
  });

  it('should find indirect references in response schemas', () => {
    const spec: OpenAPISpec = {
      paths: {
        '/orders': {
          get: {
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        order: {
                          type: 'object',
                          properties: {
                            items: {
                              type: 'array',
                              items: {
                                $ref: '#/components/schemas/OrderItem'
                              }
                            },
                            customer: {
                              $ref: '#/components/schemas/Customer'
                            }
                          }
                        }
                      }
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
          OrderItem: {
            type: 'object',
            properties: {
              product: {
                $ref: '#/components/schemas/Product'
              }
            }
          },
          Product: {
            type: 'object'
          },
          Customer: {
            type: 'object'
          }
        }
      }
    };

    const refs = findAllReferences(spec, spec.paths);
    const refArray = Array.from(refs);
    const refNames = refArray.map(ref => ref.name).sort();

    expect(refNames).toEqual(['Customer', 'OrderItem', 'Product'].sort());
  });

  it('should find indirect references in request body schemas', () => {
    const spec: OpenAPISpec = {
      paths: {
        '/posts': {
          post: {
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      post: {
                        type: 'object',
                        properties: {
                          author: {
                            $ref: '#/components/schemas/Author'
                          },
                          comments: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                user: {
                                  $ref: '#/components/schemas/User'
                                },
                                reactions: {
                                  type: 'array',
                                  items: {
                                    $ref: '#/components/schemas/Reaction'
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
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
          Author: {
            type: 'object'
          },
          User: {
            type: 'object'
          },
          Reaction: {
            type: 'object'
          }
        }
      }
    };

    const refs = findAllReferences(spec, spec.paths);
    const refArray = Array.from(refs);
    const refNames = refArray.map(ref => ref.name).sort();

    expect(refNames).toEqual(['Author', 'Reaction', 'User'].sort());
  });

  it('should find indirect references in mixed request/response schemas', () => {
    const spec: OpenAPISpec = {
      paths: {
        '/articles': {
          post: {
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      article: {
                        type: 'object',
                        properties: {
                          metadata: {
                            $ref: '#/components/schemas/Metadata'
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            responses: {
              '201': {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        article: {
                          type: 'object',
                          properties: {
                            tags: {
                              type: 'array',
                              items: {
                                $ref: '#/components/schemas/Tag'
                              }
                            }
                          }
                        }
                      }
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
          Metadata: {
            type: 'object',
            properties: {
              category: {
                $ref: '#/components/schemas/Category'
              }
            }
          },
          Category: {
            type: 'object'
          },
          Tag: {
            type: 'object'
          }
        }
      }
    };

    const refs = findAllReferences(spec, spec.paths);
    const refArray = Array.from(refs);
    const refNames = refArray.map(ref => ref.name).sort();

    expect(refNames).toEqual(['Category', 'Metadata', 'Tag'].sort());
  });
});