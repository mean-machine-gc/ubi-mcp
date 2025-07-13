// schemas/dynamic-decider-schema.ts
import { Type, Static, TSchema } from '@sinclair/typebox';

// Type notation schema (unchanged)
export const TypeNotationSchema = Type.String({
  pattern: '^("string"|"number"|"boolean"|"Date"|"[^"]*"|\'.+\'|[a-zA-Z][a-zA-Z0-9]*)(\\?)?$',
  description: 'TypeScript-like type notation'
});

// Base schemas (unchanged)
export const StateShapeBaseSchema = Type.Record(
  Type.String(),
  TypeNotationSchema
);

export const StateShapeWhenSchema = Type.Object({
  status: Type.String({ pattern: '^\'[a-z_]+\'$' })
}, { additionalProperties: TypeNotationSchema });

// Data and metadata schemas (unchanged)
export const DataShapeSchema = Type.Record(
  Type.String(),
  Type.Union([
    TypeNotationSchema,
    Type.Record(Type.String(), TypeNotationSchema)
  ])
);

export const MetadataShapeSchema = Type.Record(
  Type.String(),
  TypeNotationSchema
);

export const CommandShapeSchema = Type.Object({
  type: Type.String({ pattern: '^\'[a-z][a-z-]*\'$' }),
  data: DataShapeSchema,
  metadata: Type.Optional(MetadataShapeSchema)
});

export const EventShapeSchema = Type.Object({
  type: Type.String({ pattern: '^\'[a-z][a-z-]*\'$' }),
  data: DataShapeSchema,
  metadata: Type.Optional(MetadataShapeSchema)
});

// DYNAMIC: Create state shape schema based on detected states
export function createDynamicStateShapeSchema(states: string[]): TSchema {
  const properties: Record<string, TSchema> = {
    base: StateShapeBaseSchema,
    additional_fields: Type.Optional(StateShapeBaseSchema)
  };
  
  // Add when_[state] for each detected state
  states.forEach(state => {
    properties[`when_${state}`] = Type.Optional(StateShapeWhenSchema);
  });
  
  return Type.Object(properties);
}

// DYNAMIC: Create full decider schema
export function createDeciderSchema(states: string[]): TSchema {
  const dynamicStateShapeSchema = createDynamicStateShapeSchema(states);
  
  return Type.Object({
    aggregate: Type.String({ pattern: '^[A-Z][a-zA-Z0-9]*$' }),
    version: Type.String({ pattern: '^\\d+\\.\\d+\\.\\d+$' }),
    state_shape: dynamicStateShapeSchema,
    command_shapes: Type.Record(
      Type.String({ pattern: '^[a-z][a-z-]*$' }),
      CommandShapeSchema
    ),
    event_shapes: Type.Record(
      Type.String({ pattern: '^[a-z][a-z-]*$' }),
      EventShapeSchema
    )
  });
}

// Static fallback schema (for when states are unknown)
export const StaticDeciderSchema = createDeciderSchema(['pending', 'active', 'inactive']);

export type DeciderSpec = Static<typeof StaticDeciderSchema>;
export type StateShape = Static<ReturnType<typeof createDynamicStateShapeSchema>>;
export type CommandShape = Static<typeof CommandShapeSchema>;
export type EventShape = Static<typeof EventShapeSchema>;