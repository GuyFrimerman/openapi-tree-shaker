import type { OpenAPISpec, TreeShakeResult } from '../types/openapi';
import { findAllReferences } from '../utils/references';

export function treeShakeOpenAPI(
  spec: OpenAPISpec,
  endpointPatterns: string[] = ['.*']
): TreeShakeResult {
  // Convert patterns to RegExp objects
  const regexPatterns = endpointPatterns.map(pattern => new RegExp(pattern));
  
  // Keep track of removed items
  const summary = {
    removedPaths: [] as string[],
    removedSchemas: [] as string[],
    removedParameters: [] as string[],
    removedResponses: [] as string[],
    removedRequestBodies: [] as string[],
  };
  
  // Filter paths based on patterns
  const filteredPaths: Record<string, any> = {};
  for (const [path, methods] of Object.entries(spec.paths)) {
    if (regexPatterns.some(pattern => pattern.test(path))) {
      filteredPaths[path] = methods;
    } else {
      summary.removedPaths.push(path);
    }
  }
  
  // Find all references used in the filtered paths
  const usedRefs = findAllReferences(spec, filteredPaths);
  
  // Create new spec with only used components
  const newSpec: OpenAPISpec = {
    ...spec,
    paths: filteredPaths,
  };

  // Handle OpenAPI 2.0
  if (spec.definitions) {
    newSpec.definitions = {};
    for (const [name, schema] of Object.entries(spec.definitions)) {
      if (Array.from(usedRefs).some(ref => ref.type === 'schemas' && ref.name === name)) {
        newSpec.definitions[name] = schema;
      } else {
        summary.removedSchemas.push(name);
      }
    }
  }

  // Handle OpenAPI 3.0
  if (spec.components) {
    newSpec.components = {};

    // Helper function to process each component type
    const processComponents = (type: 'schemas' | 'parameters' | 'responses' | 'requestBodies') => {
      if (spec.components?.[type]) {
        if (!newSpec.components) {
          newSpec.components = {};
        }
        newSpec.components[type] = {};
        for (const [name, component] of Object.entries(spec.components[type])) {
          if (Array.from(usedRefs).some(ref => ref.type === type && ref.name === name)) {
            if (!newSpec.components[type]) {
              newSpec.components[type] = {};
            }
            newSpec.components[type][name] = component;
          } else {
            summary[`removed${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof typeof summary].push(name);
          }
        }
      }
    };

    // Only process component types that exist in the original spec
    if (spec.components.schemas) processComponents('schemas');
    if (spec.components.parameters) processComponents('parameters');
    if (spec.components.responses) processComponents('responses');
    if (spec.components.requestBodies) processComponents('requestBodies');

    // Remove empty component sections
    if (newSpec.components) {
      Object.keys(newSpec.components).forEach(key => {
        if (Object.keys(newSpec.components![key] || {}).length === 0) {
          delete newSpec.components![key];
        }
      });

      // Remove components object if it's empty
      if (Object.keys(newSpec.components).length === 0) {
        delete newSpec.components;
      }
    }
  }
  
  return { spec: newSpec, summary };
}