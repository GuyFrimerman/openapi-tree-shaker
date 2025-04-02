import type {
  OpenAPISpec,
  TreeShakeResult,
  PathItemObject,
  ParsedReference,
} from '../types/openapi';
import type { OpenAPIV2, OpenAPIV3 } from 'openapi-types';
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
    removedSecuritySchemes: [] as string[],
  };

  // Filter paths based on patterns
  const filteredPaths: Record<string, PathItemObject> = {};
  const paths = spec.paths || {};

  for (const [path, methods] of Object.entries(paths)) {
    if (regexPatterns.some(pattern => pattern.test(path))) {
      filteredPaths[path] = methods as PathItemObject;
    } else {
      summary.removedPaths.push(path);
    }
  }

  // Find all references used in the filtered paths
  const usedRefs = findAllReferences(spec, filteredPaths);

  // Create new spec with only used components
  const newSpec = { ...spec, paths: filteredPaths } as OpenAPISpec;

  // Handle OpenAPI 2.0
  const spec2 = spec as OpenAPIV2.Document;
  if ('swagger' in spec) {
    const newSpec2 = newSpec as OpenAPIV2.Document;

    // Handle definitions
    if (spec2.definitions) {
      newSpec2.definitions = {};
      for (const [name, schema] of Object.entries(spec2.definitions)) {
        if (
          Array.from(usedRefs).some(
            (ref: ParsedReference) => ref.type === 'schemas' && ref.name === name
          )
        ) {
          newSpec2.definitions[name] = schema;
        } else {
          summary.removedSchemas.push(name);
        }
      }
    }

    // Handle security definitions
    if (spec2.securityDefinitions) {
      newSpec2.securityDefinitions = {};
      for (const [name, scheme] of Object.entries(spec2.securityDefinitions)) {
        if (
          Array.from(usedRefs).some(
            (ref: ParsedReference) => ref.type === 'securitySchemes' && ref.name === name
          )
        ) {
          newSpec2.securityDefinitions[name] = scheme;
        } else {
          summary.removedSecuritySchemes.push(name);
        }
      }
    }
  }

  // Handle OpenAPI 3.0
  const spec3 = spec as OpenAPIV3.Document;
  if ('openapi' in spec && spec3.components) {
    const newSpec3 = newSpec as OpenAPIV3.Document;
    newSpec3.components = {} as OpenAPIV3.ComponentsObject;

    // Helper function to process each component type
    const processComponents = (type: keyof OpenAPIV3.ComponentsObject) => {
      const components = spec3.components?.[type];
      if (components) {
        newSpec3.components![type] = {};

        for (const [name, component] of Object.entries(components)) {
          if (
            Array.from(usedRefs).some(
              (ref: ParsedReference) => ref.type === type && ref.name === name
            )
          ) {
            newSpec3.components![type]![name] = component;
          } else {
            const summaryKey =
              `removed${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof typeof summary;
            if (Array.isArray(summary[summaryKey])) {
              (summary[summaryKey] as string[]).push(name);
            }
          }
        }
      }
    };

    // Process all component types
    if (spec3.components.schemas) processComponents('schemas');
    if (spec3.components.parameters) processComponents('parameters');
    if (spec3.components.responses) processComponents('responses');
    if (spec3.components.requestBodies) processComponents('requestBodies');
    if (spec3.components.securitySchemes) processComponents('securitySchemes');

    // Remove empty component sections
    const componentKeys = Object.keys(newSpec3.components) as Array<
      keyof OpenAPIV3.ComponentsObject
    >;
    for (const key of componentKeys) {
      const component = newSpec3.components[key] as Record<string, unknown> | undefined;
      if (component && Object.keys(component).length === 0) {
        delete newSpec3.components[key] as unknown;
      }
    }

    // Remove components object if it's empty
    if (Object.keys(newSpec3.components).length === 0) {
      delete newSpec3.components;
    }
  }

  return { spec: newSpec, summary };
}
