// schemas/dynamic-lifecycle-schema.ts
import { Type, Static, TSchema } from '@sinclair/typebox';
import * as YAML from 'yaml';
import { OperationSchema } from './lifecycle-schema';

// Base invariant set schema
export const InvariantSetSchema = Type.Record(
  Type.String({ pattern: '^[a-z][a-z_]*$' }),
  Type.String({ minLength: 5 })
);

export const TransitionsSchema = Type.Record(
  Type.String({ pattern: '^[a-z_]+_to_[a-z_]+$' }),
  Type.Array(Type.String())
);



// Extract states from a YAML content string
export function extractStatesFromYAML(yamlContent: string): string[] {
  try {
    const data = YAML.parse(yamlContent);
    const states = new Set<string>();
    
    // Look for status values in operations, branches, etc.
    if (data.operations) {
      data.operations.forEach((op: any) => {
        // Extract from preconditions that check status
        if (op.preconditions) {
          op.preconditions.forEach((precondition: string) => {
            // Look for patterns like "user_is_active", "order_is_pending"
            const statusMatch = precondition.match(/[a-z_]+_is_([a-z_]+)/);
            if (statusMatch) {
              states.add(statusMatch[1]);
            }
          });
        }
        
        // Extract from guards
        if (op.guards) {
          op.guards.forEach((guard: string) => {
            const statusMatch = guard.match(/[a-z_]+_is_([a-z_]+)/);
            if (statusMatch) {
              states.add(statusMatch[1]);
            }
          });
        }
      });
    }
    
    // Look for explicit state mentions in invariants
    if (data.invariants) {
      Object.keys(data.invariants).forEach(key => {
        const whenMatch = key.match(/^when_([a-z_]+)$/);
        if (whenMatch) {
          states.add(whenMatch[1]);
        }
      });
    }
    
    return Array.from(states).sort();
  } catch (error) {
    return ['pending', 'active', 'inactive']; // fallback
  }
}

// Generate dynamic invariants schema based on detected states
export function createDynamicInvariantsSchema(states: string[]): TSchema {
  const properties: Record<string, TSchema> = {
    global: Type.Optional(InvariantSetSchema),
    transitions: Type.Optional(TransitionsSchema)
  };
  
  // Add when_[state] for each detected state
  states.forEach(state => {
    properties[`when_${state}`] = Type.Optional(InvariantSetSchema);
  });
  
  return Type.Object(properties);
}

// Generate dynamic lifecycle schema
export function createLifecycleSchema(yamlContent?: string): TSchema {
  const states = yamlContent ? extractStatesFromYAML(yamlContent) : ['pending', 'active', 'inactive'];
  const dynamicInvariantsSchema = createDynamicInvariantsSchema(states);
  
  return Type.Object({
    aggregate: Type.String({ pattern: '^[A-Z][a-zA-Z0-9]*$' }),
    version: Type.String({ pattern: '^\\d+\\.\\d+\\.\\d+$' }),
    description: Type.String({ minLength: 10 }),
    operations: Type.Array(OperationSchema, { minItems: 1 }),
    invariants: Type.Optional(dynamicInvariantsSchema)
  });
}