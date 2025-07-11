# Generate Aggregate Decider YAML from Source Files

## Context & Purpose

You are helping to implement an **event-driven, aggregate-based architecture** where business logic is specified through YAML files. We need to generate **data shape definitions and contracts** from business behavior specifications.

## Architecture Overview

Our system uses **3 layers** with clear separation of concerns:

1. **Inbox Layer**: Handles async operations (authentication, external system calls)
2. **Decider Layer**: Pure functions that implement business logic (no side effects)
3. **Outbox Layer**: Processes outcomes and publishes events

## File Structure

Each aggregate has **3 YAML files**:

1. **`<aggregate>.lifecycle.yaml`** - High-level business behavior specification
2. **`<aggregate>.assertions.yaml`** - Implementation specifications with executable assertions
3. **`<aggregate>.decider.yaml`** - Data shapes and contracts

## Your Task

Generate a complete **`<aggregate>.decider.yaml`** file from the provided **`<aggregate>.lifecycle.yaml`** AND **`<aggregate>.assertions.yaml`** files.

## Why Both Sources?

- **`lifecycle.yaml`** provides: Operations, invariants, state definitions, business concepts
- **`assertions.yaml`** provides: Command/event names, data field usage, metadata requirements, validation patterns

Using both ensures complete and accurate data contracts.

## Key Extraction Rules

### 1. State Shape Definitions

**From lifecycle.yaml invariants:**
- Extract **base properties** common to all states
- Create **state-specific sections** based on `when_pending`, `when_active`, `when_inactive`
- Each state section MUST include explicit `status` property
- Identify **additional optional fields** from assertions and lifecycle context

**Pattern:**
```yaml
state_shape:
  base:
    # Common properties across all states
  when_pending:
    status: "'pending'"
    # Pending-specific properties
  when_active:
    status: "'active'"
    # Active-specific properties (may be empty beyond status)
  when_inactive:
    status: "'inactive'"
    # Inactive-specific properties
  additional_fields:
    # Optional enhancement fields
```

### 2. Command Shape Definitions

**From lifecycle.yaml operations + assertions.yaml:**
- Extract command names from lifecycle `when:` clauses
- Determine `data` structure from assertions usage patterns
- Extract `metadata` requirements from assertions preconditions and guards
- Include type annotations for all fields

**Pattern:**
```yaml
command_shapes:
  command-name:
    type: "'command-name'"
    data:
      # Required payload fields with types
    metadata:
      # Authentication tokens, pre-resolved checks, etc.
```

### 3. Event Shape Definitions

**From lifecycle.yaml operations:**
- Extract event names from lifecycle `then:` clauses
- Determine `data` structure from business context and outcome requirements
- Include standard `metadata` pattern for all events
- Focus on business-relevant data, not internal state details

**Pattern:**
```yaml
event_shapes:
  event-name:
    type: "'event-name'"
    data:
      # Business-relevant event data
    metadata:
      # Standard event metadata
```

## Type Annotation Guidelines

- **Strings**: `"string"`
- **Optional strings**: `"string?"`
- **Literal types**: `"'active' | 'inactive' | 'pending'"`
- **Objects**: Nested structure with properties
- **Dates**: `"Date"`
- **Numbers**: `"number"`
- **Booleans**: `"boolean"`

## Data Structure Standards

- **Commands**: Use `data` property (not `payload`)
- **Events**: Use `data` property (not `payload`)
- **Metadata**: Standard pattern with `token`, `aggregateId`, `version`, `timestamp`, `commandId`
- **State Status**: Must be explicit literal type in each state section

## Field Inference Strategies

### State Fields
- **From invariants**: Extract required/optional properties per state
- **From assertions**: Identify fields used in validations
- **From business logic**: Infer timestamp fields, reason fields, etc.

### Command Fields
- **From operation descriptions**: Infer required business data
- **From preconditions**: Identify validation requirements
- **From guards**: Extract metadata needs (tokens, pre-resolved checks)

### Event Fields
- **From outcomes**: Determine what data events should carry
- **From business value**: Include data relevant to subscribers
- **Minimal principle**: Don't expose internal state details

## Common Patterns to Recognize

### Authentication Metadata
```yaml
metadata:
  token: "string"
  userId: "string"
```

### External System Checks
```yaml
metadata:
  emailIsAvailable: "boolean"
  passwordIsCorrect: "boolean"
  hasPendingOrders: "boolean"
```

### Standard Event Metadata
```yaml
metadata:
  aggregateId: "string"
  version: "number"
  timestamp: "Date"
  commandId: "string"
```

### Profile Objects
```yaml
profile:
  firstName: "string"
  lastName: "string"
  avatar: "string?"
```

## Quality Requirements

- **Complete coverage**: All commands/events from lifecycle have shapes
- **Type accuracy**: Proper optional/required field marking
- **Business alignment**: Shapes reflect actual business needs
- **Consistency**: Standard patterns used throughout
- **Minimal exposure**: Events don't leak internal state details
- **Extensibility**: Additional_fields section for optional enhancements

## Output Structure

Generate exactly this structure:
1. **`state_shape`** - Base + state-specific + additional fields
2. **`command_shapes`** - All commands with data + metadata
3. **`event_shapes`** - All events with data + metadata

Ensure every command and event referenced in the lifecycle has a complete shape definition with proper typing and follows our architectural patterns.