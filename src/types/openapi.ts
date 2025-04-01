export interface OpenAPISpec {
  paths: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
    parameters?: Record<string, any>;
    responses?: Record<string, any>;
    requestBodies?: Record<string, any>;
    [key: string]: any;
  };
  [key: string]: any;
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

export interface Reference {
  name: string;
  type: 'schemas' | 'parameters' | 'responses' | 'requestBodies';
}

export interface Endpoint {
  path: string;
  method: string;
  selected: boolean;
}