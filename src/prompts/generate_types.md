# Generate Aggregate TypeScript Types from Lifecycle and Assertions YAML

## Context & Purpose

You are helping to implement an **event-driven, aggregate-based architecture** where business logic is specified through YAML files and implemented with strict TypeScript types. We need to generate comprehensive TypeScript type definitions that ensure type safety across the entire aggregate lifecycle.

## Architecture Overview

Our system uses **3 layers** with clear separation of concerns:

1. **Inbox Layer**: Handles async operations (authentication, external system calls)
2. **Decider Layer**: Pure functions that implement business logic (no side effects)  
3. **Outbox Layer**: Processes outcomes and publishes events

## File Structure

Each aggregate has **3 core files**:

1. **`<aggregate>.lifecycle.yaml`** - High-level business behavior specification
2. **`<aggregate>.assertions.yaml`** - Implementation specifications with executable assertions
3. **`<aggregate>.types.ts`** - TypeScript type definitions and contracts (your output)

## Your Task

Generate a complete **`<aggregate>.types.ts`** file from the provided **`<aggregate>.lifecycle.yaml`** and **`<aggregate>.assertions.yaml`** files.

## Key Generation Rules

### 1. Imports and Framework Types
Start with required imports:
```typescript
import { TDecider } from 'ubi-decider'
```

### 2. Status/State Enums
From lifecycle operations, extract all possible aggregate states:
- Analyze state transitions and status changes
- Create union type for status values
- Use string literal types: `"pending" | "active" | "inactive"`

### 3. Base Types and State Variants
Create state type hierarchy:
- **Base type** with common fields across all states
- **State-specific types** for each status with invariants
- Use TypeScript discriminated unions with `status` as discriminator
- Add JSDoc comments with `@invariant` constraints

### 4. Command Types
From lifecycle operations (`when` field), generate command types:
- Each operation becomes a command type
- Extract required data from preconditions and assertions
- Include pre-resolved metadata fields from assertions
- Add validation patterns from business rules
- Use JSDoc annotations for validation rules (`@pattern`, `@minLength`, etc.)

### 5. Event Types
From lifecycle operations (`then` field), generate event types:
- Each successful outcome becomes an event type
- Include relevant data that would be needed by event consumers
- Keep events focused on essential state change information

### 6. Failure Types
From assertions and preconditions, extract possible failure scenarios:
- Create union type of string literals for each failure case
- Base on validation rules and business constraints

### 7. Aggregate Decider Type
Create the complete decider type definition:
```typescript
export type T<Aggregate>Decider = TDecider<
  <Aggregate>Cmd,
  <Aggregate>Evt,
  <Aggregate>,
  <Aggregate>Failures
>;
```

## TypeScript Type Patterns

### State Types with Invariants
```typescript
/**
 * Description of state
 * @invariant Business rule constraint
 * @invariant Another constraint
 */
export type SpecificState = BaseType & {
  /** @const */
  status: "specific";
  // state-specific fields
};
```

### Command Types with Validation
```typescript
/**
 * Command description
 * @businessRule Authorization rule
 * @businessRule Business constraint
 */
export type SpecificCmd = {
  /** @const */
  type: "command-type";
  data: {
    /** 
     * Field description
     * @pattern RegExp pattern
     * @minLength number
     * @maxLength number
     * @format format type
     */
    field: string;
  };
};
```

### Event Types
```typescript
/**
 * Event description
 * @emittedWhen Condition for emission
 */
export type SpecificEvt = {
  /** @const */
  type: "event-type";
  data: {
    // relevant event data
  };
};
```

## Data Extraction Rules

### From Lifecycle YAML:
- **Operations** → Command types (use `when` field for type name)
- **Guards** → Business rules in JSDoc comments
- **Preconditions** → Required fields and validation rules
- **Branches/Outcomes** → Event types (use `then` field for type name)
- **State changes** → Status enum values and state types

### From Assertions YAML:
- **Preconditions** → Validation patterns and field requirements
- **Outcome assertions** → Event data fields and state properties
- **Guard specifications** → Metadata fields for commands
- **Validation functions** → TypeScript validation patterns

## Field Type Inference

### String Fields:
- Email validation → `@format email` + email pattern
- Password fields → security patterns with complexity requirements
- IDs → alphanumeric patterns with minimum length
- Names → Unicode letter patterns with length constraints
- URLs → URI format with specific file type patterns

### Numeric Fields:
- Timestamps → `number` with `@minimum 0` and Unix timestamp description
- Counters → `number` with min/max constraints
- IDs → could be `string` or `number` based on pattern

### Boolean Fields:
- Acceptance flags → `@const true` if must be true
- Status flags → regular boolean if can be true/false
- Pre-resolved checks → boolean with descriptive comments

### Optional Fields:
- Use `?` for fields that may not be present in all states
- Consider state-specific requirements vs truly optional fields

## Validation Pattern Mapping

Common patterns to include:
- **Email**: `^[^\s@]+@[^\s@]+\.[^\s@]+$`
- **Password**: Complex requirements with character classes
- **ID**: `^[a-zA-Z0-9\-_]{8,}$`
- **Name**: `^[a-zA-ZÀ-ÿ\s\-'\.]+$`
- **Bcrypt**: `^\\$2[ayb]\\$[0-9]{2}\\$[A-Za-z0-9\\.\/]{53}$`
- **URL**: `^https?://.*\.(jpg|jpeg|png|gif|webp)(\?.*)?$`

## State Invariant Rules

For each state type, include invariants that:
- Define required fields for that state
- Specify field constraints and relationships
- Describe business rules that must hold
- Reference timing constraints (e.g., expiration, reactivation windows)

## Naming Conventions

- **Types**: Use PascalCase (`ActiveUser`, `CreateUserCmd`)
- **Properties**: Use camelCase (`firstName`, `passwordHash`)
- **Constants**: Use camelCase for type literals (`"create-user"`)
- **Generics**: Use `T` prefix for aggregate decider type

## Quality Requirements

- **Type Safety**: All operations should be type-safe with proper narrowing
- **Runtime Validation**: Types should support runtime validation via patterns
- **Documentation**: Comprehensive JSDoc with business context
- **Completeness**: Cover all states, commands, events, and failures
- **Consistency**: Align with lifecycle behavior and assertion specifications
- **Maintainability**: Clear structure with logical grouping

## Expected Output Structure

1. **Imports** - Framework and utility imports
2. **Status Types** - Enum/union for aggregate states  
3. **Base Types** - Common properties across states
4. **State Types** - Specific state variants with invariants
5. **Union State Type** - Combined state type
6. **Command Types** - All operation commands
7. **Command Union** - Combined command type
8. **Event Types** - All outcome events  
9. **Event Union** - Combined event type
10. **Failure Types** - All possible failures
11. **Decider Type** - Complete aggregate type definition

Generate comprehensive TypeScript types that provide complete type safety for the aggregate while maintaining alignment with the business rules defined in the lifecycle and assertions files.