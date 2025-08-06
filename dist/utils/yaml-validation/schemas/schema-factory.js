// schemas/schema-factory.ts
import { Type } from '@sinclair/typebox';
import { createLifecycleSchema, createDynamicInvariantsSchema } from './dynamic-lifecycle-schema';
import { createDeciderSchema } from './dynamic-decider-schema';
import { AssertionsSchema } from './assertions-schema';
import * as YAML from 'yaml';
import { OperationSchema } from './lifecycle-schema';
export class SchemaFactory {
    // Create schemas based on lifecycle content
    createSchemasFromLifecycle(lifecycleContent) {
        const states = this.extractStatesFromLifecycle(lifecycleContent);
        return {
            lifecycle: createLifecycleSchema(lifecycleContent),
            assertions: AssertionsSchema, // This one doesn't need to be dynamic
            decider: createDeciderSchema(states),
            detectedStates: states
        };
    }
    // Create schemas with known states
    createSchemasWithStates(states) {
        return {
            lifecycle: this.createLifecycleSchemaWithStates(states),
            assertions: AssertionsSchema,
            decider: createDeciderSchema(states),
            detectedStates: states
        };
    }
    // Fallback schemas (when no context available)
    createDefaultSchemas() {
        const defaultStates = ['pending', 'active', 'inactive'];
        return this.createSchemasWithStates(defaultStates);
    }
    createLifecycleSchemaWithStates(states) {
        const dynamicInvariantsSchema = createDynamicInvariantsSchema(states);
        return Type.Object({
            aggregate: Type.String({ pattern: '^[A-Z][a-zA-Z0-9]*$' }),
            version: Type.String({ pattern: '^\\d+\\.\\d+\\.\\d+$' }),
            description: Type.String({ minLength: 10 }),
            operations: Type.Array(OperationSchema, { minItems: 1 }),
            invariants: Type.Optional(dynamicInvariantsSchema)
        });
    }
    extractStatesFromLifecycle(lifecycleContent) {
        // Same implementation as extractStatesFromYAML
        try {
            const data = YAML.parse(lifecycleContent);
            const states = new Set();
            // Extract from operations
            data.operations?.forEach((op) => {
                op.preconditions?.forEach((precondition) => {
                    const match = precondition.match(/[a-z_]+_is_([a-z_]+)/);
                    if (match)
                        states.add(match[1]);
                });
                op.guards?.forEach((guard) => {
                    const match = guard.match(/[a-z_]+_is_([a-z_]+)/);
                    if (match)
                        states.add(match[1]);
                });
            });
            // Extract from invariants
            if (data.invariants) {
                Object.keys(data.invariants).forEach(key => {
                    const match = key.match(/^when_([a-z_]+)$/);
                    if (match)
                        states.add(match[1]);
                });
            }
            return Array.from(states).sort();
        }
        catch (error) {
            return ['pending', 'active', 'inactive']; // fallback
        }
    }
}
