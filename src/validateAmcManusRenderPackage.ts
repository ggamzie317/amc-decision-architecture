type ValidationResult = {
  valid: boolean;
  errors: string[];
};

function resolveRef(rootSchema: any, ref: string): any {
  if (!ref.startsWith("#/")) {
    throw new Error(`Unsupported $ref '${ref}'`);
  }
  const parts = ref.slice(2).split("/");
  let cursor = rootSchema;
  for (const part of parts) {
    cursor = cursor?.[part];
  }
  if (!cursor) {
    throw new Error(`Could not resolve $ref '${ref}'`);
  }
  return cursor;
}

function validateNode(value: any, schemaNode: any, rootSchema: any, pathKey: string, errors: string[]): void {
  if (!schemaNode) {
    return;
  }
  if (schemaNode.$ref) {
    validateNode(value, resolveRef(rootSchema, schemaNode.$ref), rootSchema, pathKey, errors);
    return;
  }

  if (Object.prototype.hasOwnProperty.call(schemaNode, "const") && value !== schemaNode.const) {
    errors.push(`${pathKey}: expected const '${schemaNode.const}', got '${String(value)}'`);
    return;
  }

  if (schemaNode.enum && Array.isArray(schemaNode.enum) && !schemaNode.enum.includes(value)) {
    errors.push(`${pathKey}: value '${String(value)}' not in enum`);
    return;
  }

  const type = schemaNode.type;
  if (type === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      errors.push(`${pathKey}: expected object`);
      return;
    }
    const required = Array.isArray(schemaNode.required) ? schemaNode.required : [];
    for (const key of required) {
      if (!(key in value)) {
        errors.push(`${pathKey}: missing required key '${key}'`);
      }
    }
    const properties = schemaNode.properties || {};
    if (schemaNode.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!(key in properties)) {
          errors.push(`${pathKey}: unexpected key '${key}'`);
        }
      }
    }
    for (const [key, child] of Object.entries(properties)) {
      if (key in value) {
        validateNode((value as any)[key], child, rootSchema, `${pathKey}.${key}`, errors);
      }
    }
    return;
  }

  if (type === "array") {
    if (!Array.isArray(value)) {
      errors.push(`${pathKey}: expected array`);
      return;
    }
    if (typeof schemaNode.minItems === "number" && value.length < schemaNode.minItems) {
      errors.push(`${pathKey}: minItems ${schemaNode.minItems} violated`);
    }
    if (typeof schemaNode.maxItems === "number" && value.length > schemaNode.maxItems) {
      errors.push(`${pathKey}: maxItems ${schemaNode.maxItems} violated`);
    }
    if (schemaNode.items) {
      value.forEach((item: any, index: number) => {
        validateNode(item, schemaNode.items, rootSchema, `${pathKey}[${index}]`, errors);
      });
    }
    return;
  }

  if (type === "string") {
    if (typeof value !== "string") {
      errors.push(`${pathKey}: expected string`);
      return;
    }
    if (typeof schemaNode.minLength === "number" && value.length < schemaNode.minLength) {
      errors.push(`${pathKey}: minLength ${schemaNode.minLength} violated`);
    }
    return;
  }

  if (type === "number") {
    if (typeof value !== "number" || Number.isNaN(value)) {
      errors.push(`${pathKey}: expected number`);
      return;
    }
    if (typeof schemaNode.minimum === "number" && value < schemaNode.minimum) {
      errors.push(`${pathKey}: minimum ${schemaNode.minimum} violated`);
    }
    if (typeof schemaNode.maximum === "number" && value > schemaNode.maximum) {
      errors.push(`${pathKey}: maximum ${schemaNode.maximum} violated`);
    }
    return;
  }

  if (type === "boolean" && typeof value !== "boolean") {
    errors.push(`${pathKey}: expected boolean`);
  }
}

export function validateAmcManusRenderPackageV1(schema: any, instance: any): ValidationResult {
  const errors: string[] = [];
  validateNode(instance, schema, schema, "$", errors);
  return { valid: errors.length === 0, errors };
}

