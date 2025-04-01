import type { Reference, OpenAPISpec } from '../types/openapi';

export function parseRef(ref: string): Reference | null {
  // Handle both OpenAPI 2.0 and 3.0 references
  const v2Match = ref.match(/^#\/definitions\/(.+)$/);
  if (v2Match) {
    return { type: 'schemas', name: v2Match[1] };
  }

  const v3Match = ref.match(/^#\/components\/(\w+)\/(.+)$/);
  if (v3Match) {
    const [, type, name] = v3Match;
    if (type !== 'schemas' && type !== 'parameters' && type !== 'responses' && type !== 'requestBodies') {
      return null;
    }
    return { type, name };
  }

  return null;
}

export function findReferencesInObject(obj: any, refs: Set<Reference>, visited = new Set<any>()): void {
  if (!obj || typeof obj !== 'object') return;
  
  const objKey = obj instanceof Object ? obj : JSON.stringify(obj);
  if (visited.has(objKey)) return;
  visited.add(objKey);

  if (Array.isArray(obj)) {
    obj.forEach(item => findReferencesInObject(item, refs, visited));
    return;
  }

  for (const [key, value] of Object.entries(obj)) {
    if (key === '$ref' && typeof value === 'string') {
      const ref = parseRef(value);
      if (ref) {
        if (!Array.from(refs).some(r => r.type === ref.type && r.name === ref.name)) {
          refs.add(ref);
        }
      }
    } else if (typeof value === 'object') {
      findReferencesInObject(value, refs, visited);
    }
  }
}

export function findAllReferences(spec: OpenAPISpec, paths: Record<string, any>): Set<Reference> {
  const refs = new Set<Reference>();
  const visited = new Set<any>();
  const processedRefs = new Set<string>();
  const queue: Reference[] = [];

  // Find initial references in paths
  findReferencesInObject(paths, refs, visited);

  // Add initial references to queue
  for (const ref of refs) {
    const refKey = `${ref.type}:${ref.name}`;
    if (!processedRefs.has(refKey)) {
      queue.push(ref);
    }
  }

  while (queue.length > 0) {
    const ref = queue.shift()!;
    const refKey = `${ref.type}:${ref.name}`;

    if (processedRefs.has(refKey)) continue;
    processedRefs.add(refKey);

    let component;
    if (ref.type === 'schemas' && spec.definitions) {
      component = spec.definitions[ref.name];
    } else if (spec.components?.[ref.type]) {
      component = spec.components[ref.type]?.[ref.name];
    }

    if (component) {
      const prevSize = refs.size;
      findReferencesInObject(component, refs, visited);

      if (refs.size > prevSize) {
        for (const newRef of refs) {
          const newRefKey = `${newRef.type}:${newRef.name}`;
          if (!processedRefs.has(newRefKey) && !queue.some(qRef => 
            qRef.type === newRef.type && qRef.name === newRef.name
          )) {
            queue.push(newRef);
          }
        }
      }
    }
  }

  return refs;
}