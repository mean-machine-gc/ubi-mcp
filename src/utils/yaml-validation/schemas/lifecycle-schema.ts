// schemas/lifecycle-schema.ts
import { Type, Static } from '@sinclair/typebox';

// Base types
export const AggregateNameSchema = Type.String({
  pattern: '^[A-Z][a-zA-Z0-9]*$',
  description: 'Aggregate name in PascalCase'
});

export const VersionSchema = Type.String({
  pattern: '^\\d+\\.\\d+\\.\\d+$',
  description: 'Semantic version'
});

export const CommandNameSchema = Type.String({
  pattern: '^[a-z][a-z-]*$',
  description: 'Command name in kebab-case'
});

export const EventNameSchema = Type.String({
  pattern: '^[a-z][a-z-]*$',
  description: 'Event name in kebab-case'
});

export const GuardNameSchema = Type.String({
  pattern: '^[a-z][a-z_]*$',
  description: 'Guard name in snake_case'
});

// Branch definition
export const BranchSchema = Type.Object({
  condition: Type.String({ minLength: 1 }),
  then: EventNameSchema,
  andOutcome: Type.Array(Type.String({
    pattern: '^[a-z][a-z_]*$'
  }), { minItems: 1 })
});

// Operation definition
export const OperationSchema = Type.Object({
  name: Type.String({ pattern: '^[A-Z][a-zA-Z0-9]*$' }),
  description: Type.String({ minLength: 10 }),
  guards: Type.Optional(Type.Array(GuardNameSchema)),
  when: CommandNameSchema,
  preconditions: Type.Array(GuardNameSchema, { minItems: 1 }),
  branches: Type.Array(BranchSchema, { minItems: 1 })
});

// Invariant sets
export const InvariantSetSchema = Type.Record(
  Type.String({ pattern: '^[a-z][a-z_]*$' }),
  Type.String({ minLength: 5 })
);

export const TransitionsSchema = Type.Record(
  Type.String({ pattern: '^[a-z_]+_to_[a-z_]+$' }),
  Type.Array(Type.String())
);

export const InvariantsSchema = Type.Object({
  global: Type.Optional(InvariantSetSchema),
  when_pending: Type.Optional(InvariantSetSchema),
  when_active: Type.Optional(InvariantSetSchema),
  when_inactive: Type.Optional(InvariantSetSchema),
  transitions: Type.Optional(TransitionsSchema)
});

// Main lifecycle schema
export const LifecycleSchema = Type.Object({
  aggregate: AggregateNameSchema,
  version: VersionSchema,
  description: Type.String({ minLength: 10 }),
  operations: Type.Array(OperationSchema, { minItems: 1 }),
  invariants: Type.Optional(InvariantsSchema)
});

// Export TypeScript types
export type LifecycleSpec = Static<typeof LifecycleSchema>;
export type Operation = Static<typeof OperationSchema>;
export type Branch = Static<typeof BranchSchema>;
export type Invariants = Static<typeof InvariantsSchema>;