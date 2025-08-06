// schemas/assertions-schema.ts
import { Type } from '@sinclair/typebox';
export const GuardDefinitionSchema = Type.Record(Type.String({ pattern: '^[a-z][a-z_]*$' }), Type.String({ minLength: 5 }));
export const PreconditionDefinitionSchema = Type.Record(Type.String({ pattern: '^[a-z][a-z_]*$' }), Type.String({ minLength: 5 }));
export const BranchingConditionSchema = Type.Record(Type.String(), Type.String({ minLength: 1 }));
export const OutcomeAssertionSchema = Type.Object({
    assert: Type.String({ minLength: 5 }),
    description: Type.String({ minLength: 10 })
});
export const OutcomeAssertionsSchema = Type.Record(Type.String({ pattern: '^[a-z][a-z_]*$' }), OutcomeAssertionSchema);
export const InvariantsAssertionSchema = Type.Object({
    assert: Type.String({ minLength: 20 }),
    description: Type.String({ minLength: 10 })
});
export const AssertionsSchema = Type.Object({
    aggregate: Type.String({ pattern: '^[A-Z][a-zA-Z0-9]*$' }),
    version: Type.String({ pattern: '^\\d+\\.\\d+\\.\\d+$' }),
    guards: GuardDefinitionSchema,
    preconditions: PreconditionDefinitionSchema,
    branching_conditions: BranchingConditionSchema,
    outcome_assertions: OutcomeAssertionsSchema,
    invariants_assertion: InvariantsAssertionSchema
});
