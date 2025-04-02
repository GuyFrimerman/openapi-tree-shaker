import type { OpenAPISpec, ParsedReference } from '../types/openapi';
import type { OpenAPIV2, OpenAPIV3 } from 'openapi-types';

export function parseRef(ref: string): ParsedReference | null {
  // Handle OpenAPI 2.0 references
  const v2Match = ref.match(/^#\/definitions\/(.+)$/);
  if (v2Match) {
    return { type: 'schemas', name: v2Match[1] };
  }

  const v2SecurityMatch = ref.match(/^#\/securityDefinitions\/(.+)$/);
  if (v2SecurityMatch) {
    return { type: 'securitySchemes', name: v2SecurityMatch[1] };
  }

  // Handle OpenAPI 3.0 references
  const v3Match = ref.match(/^#\/components\/(\w+)\/(.+)$/);
  if (v3Match) {
    const [, type, name] = v3Match;
    if (
      type === 'schemas' ||
      type === 'parameters' ||
      type === 'responses' ||
      type === 'requestBodies' ||
      type === 'securitySchemes'
    ) {
      return { type: type as ParsedReference['type'], name };
    }
  }

  return null;
}

export function findReferencesInObject(
  obj: unknown,
  refs: Set<ParsedReference>,
  visited = new Set<unknown>()
): void {
  if (!obj || typeof obj !== 'object') return;

  if (visited.has(obj)) return;
  visited.add(obj);

  if (Array.isArray(obj)) {
    obj.forEach(item => findReferencesInObject(item, refs, visited));
    return;
  }

  for (const [key, value] of Object.entries(obj)) {
    if (key === '$ref' && typeof value === 'string') {
      const ref = parseRef(value);
      if (ref) {
        // Use a string representation to ensure uniqueness
        const refKey = `${ref.type}:${ref.name}`;
        if (!Array.from(refs).some(r => `${r.type}:${r.name}` === refKey)) {
          refs.add(ref);
        }
      }
    } else if (key === 'security' && Array.isArray(value)) {
      // Handle security requirements
      value.forEach(requirement => {
        if (requirement && typeof requirement === 'object') {
          Object.keys(requirement).forEach(schemeName => {
            refs.add({ type: 'securitySchemes', name: schemeName });
          });
        }
      });
    } else if (typeof value === 'object') {
      findReferencesInObject(value, refs, visited);
    }
  }
}

export function findAllReferences(
  spec: OpenAPISpec,
  paths: Record<string, unknown>
): Set<ParsedReference> {
  const refs = new Set<ParsedReference>();
  const visited = new Set<unknown>();
  const processedRefs = new Set<string>();
  const queue: ParsedReference[] = [];

  // Find initial references in paths
  findReferencesInObject(paths, refs, visited);

  // Add initial references to queue
  for (const ref of refs) {
    const refKey = `${ref.type}:${ref.name}`;
    if (!processedRefs.has(refKey)) {
      queue.push(ref);
    }
  }

  // Handle global security requirements
  if ('security' in spec && Array.isArray(spec.security)) {
    findReferencesInObject({ security: spec.security }, refs, visited);
  }

  while (queue.length > 0) {
    const ref = queue.shift()!;
    const refKey = `${ref.type}:${ref.name}`;

    if (processedRefs.has(refKey)) continue;
    processedRefs.add(refKey);

    let component: unknown;
    if (ref.type === 'schemas') {
      // Handle both OpenAPI 2.0 and 3.0
      const spec2 = spec as OpenAPIV2.Document;
      const spec3 = spec as OpenAPIV3.Document;

      if (spec2.definitions) {
        component = spec2.definitions[ref.name];
      } else if (spec3.components?.schemas) {
        component = spec3.components.schemas[ref.name];
      }
    } else if (ref.type === 'securitySchemes') {
      // Handle both OpenAPI 2.0 and 3.0 security schemes
      const spec2 = spec as OpenAPIV2.Document;
      const spec3 = spec as OpenAPIV3.Document;

      if (spec2.securityDefinitions) {
        component = spec2.securityDefinitions[ref.name];
      } else if (spec3.components?.securitySchemes) {
        component = spec3.components.securitySchemes[ref.name];
      }
    } else if ('components' in spec) {
      // OpenAPI 3.0 only
      const spec3 = spec as OpenAPIV3.Document;
      component = spec3.components?.[ref.type]?.[ref.name];
    }

    if (component) {
      const prevSize = refs.size;
      findReferencesInObject(component, refs, visited);

      if (refs.size > prevSize) {
        for (const newRef of refs) {
          const newRefKey = `${newRef.type}:${newRef.name}`;
          if (
            !processedRefs.has(newRefKey) &&
            !queue.some(qRef => qRef.type === newRef.type && qRef.name === newRef.name)
          ) {
            queue.push(newRef);
          }
        }
      }
    }
  }

  return refs;
}
