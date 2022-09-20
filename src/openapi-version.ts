import { JsonPointer } from "@hn3000/json-ref";

export type OpenAPIVersion = {
  name: string;
  definitionsPath: JsonPointer;
}

export function findVersion(schema): OpenAPIVersion {
  let version = "0";
  if (schema.swagger) {
    version = schema.swagger;
  }
  if (schema.openapi) {
    version = schema.openapi;
  }

  if (version.startsWith("1.")) {
    return {
      name: `Swagger ${version}`,
      definitionsPath: JsonPointer.get('/definitions')
    };
  } else if (version === "2.") {
    return {
      name: `Swagger ${version}`,
      definitionsPath: JsonPointer.get('/definitions')
    };
  } else if (version.startsWith("3.")) {
    return {
      name: `OpenAPI ${version}`,
      definitionsPath: JsonPointer.get('/components/schemas')
    };
  }
  console.warn(`encountered unknown OpenAPI version ${version}`);
  return {
    name: `Unknown OpenAPI ${version}`,
    definitionsPath: JsonPointer.get('/definitions')
  };
}

