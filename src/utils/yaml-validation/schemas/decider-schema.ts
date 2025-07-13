// schemas/decider-schema.ts
import { Type, Static } from '@sinclair/typebox';

// Type notation schema
export const TypeNotationSchema = Type.String({
  pattern: '^("string"|"number"|"boolean"|"Date"|"[^"]*"|\'.+\'|[a-zA-Z][a-zA-Z0-9]*)(\\?)?$',
  description: 'TypeScript-like type notation'
});

// State shape definitions
export const StateShapeBaseSchema = Type.Record(
  Type.String(),
  TypeNotationSchema
);

export const StateShapeWhenSchema = Type.Object({
  status: Type.String({ pattern: '^\'[a-z_]+\'$' })
}, { additionalProperties: TypeNotationSchema });

export const StateShapeSchema = Type.Object({
  base: StateShapeBaseSchema,
  when_pending: Type.Optional(StateShapeWhenSchema),
  when_active: Type.Optional(StateShapeWhenSchema),
  when_inactive: Type.Optional(StateShapeWhenSchema),
  additional_fields: Type.Optional(StateShapeBaseSchema)
});

// Command and event shape definitions
export const DataShapeSchema = Type.Record(
  Type.String(),
  Type.Union([
    TypeNotationSchema,
    Type.Record(Type.String(), TypeNotationSchema) // For nested objects
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

export const DeciderSchema = Type.Object({
  aggregate: Type.String({ pattern: '^[A-Z][a-zA-Z0-9]*$' }),
  version: Type.String({ pattern: '^\\d+\\.\\d+\\.\\d+$' }),
  state_shape: StateShapeSchema,
  command_shapes: Type.Record(
    Type.String({ pattern: '^[a-z][a-z-]*$' }),
    CommandShapeSchema
  ),
  event_shapes: Type.Record(
    Type.String({ pattern: '^[a-z][a-z-]*$' }),
    EventShapeSchema
  )
});

export type DeciderSpec = Static<typeof DeciderSchema>;
export type StateShape = Static<typeof StateShapeSchema>;
export type CommandShape = Static<typeof CommandShapeSchema>;
export type EventShape = Static<typeof EventShapeSchema>;