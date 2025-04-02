import type { OpenAPIV2, OpenAPIV3 } from 'openapi-types';

// Create a union type that supports both OpenAPI 2.0 and 3.0
export type OpenAPISpec = OpenAPIV2.Document | OpenAPIV3.Document;

// Re-export common types that work across both versions
export type PathItemObject = OpenAPIV2.PathItemObject | OpenAPIV3.PathItemObject;
export type OperationObject = OpenAPIV2.OperationObject | OpenAPIV3.OperationObject;
export type SchemaObject = OpenAPIV2.SchemaObject | OpenAPIV3.SchemaObject;
export type ParameterObject = OpenAPIV2.ParameterObject | OpenAPIV3.ParameterObject;
export type ResponseObject = OpenAPIV2.ResponseObject | OpenAPIV3.ResponseObject;
export type RequestBodyObject = OpenAPIV3.RequestBodyObject; // OpenAPI 3.0 only
export type MediaTypeObject = OpenAPIV3.MediaTypeObject; // OpenAPI 3.0 only
export type Reference = OpenAPIV2.ReferenceObject | OpenAPIV3.ReferenceObject;

export interface ParsedReference {
  type: 'schemas' | 'parameters' | 'responses' | 'requestBodies';
  name: string;
}

export interface TreeShakeResult {
  spec: OpenAPISpec;
  summary: Summary;
}

export interface Summary {
  removedPaths: string[];
  removedSchemas: string[];
  removedParameters: string[];
  removedResponses: string[];
  removedRequestBodies: string[];
}

export interface Endpoint {
  path: string;
  method: string;
  selected: boolean;
}