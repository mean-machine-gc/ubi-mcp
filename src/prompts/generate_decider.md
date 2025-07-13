# Generate Aggregate Decider TypeScript Implementation

## Context & Purpose

You are helping to implement an **event-driven, aggregate-based architecture** where business logic is specified through YAML files and implemented as TypeScript deciders. We need to generate the concrete implementation that executes the business rules defined in the specification files.

## Architecture Overview

Our system uses **3 layers** with clear separation of concerns:

1. **Inbox Layer**: Handles async operations (authentication, external system calls)
2. **Decider Layer**: Pure functions that implement business logic (no side effects)  
3. **Outbox Layer**: Processes outcomes and publishes events

The **Decider** is the core business logic implementation that:
- Validates preconditions before executing operations
- Makes branching decisions based on command/state
- Evolves state by applying events
- Maintains complete type safety

## File Structure

Each aggregate has **4 core files**:

1. **`<aggregate>.lifecycle.yaml`** - High-level business behavior specification
2. **`<aggregate>.assertions.yaml`** - Implementation specifications with executable assertions
3. **`<aggregate>.types.ts`** - TypeScript type definitions and contracts
4. **`<aggregate>.decider.ts`** - Executable business logic implementation (your output)

## Your Task

Generate a complete **`<aggregate>.decider.ts`** file from the provided **`<aggregate>.lifecycle.yaml`**, **`<aggregate>.assertions.yaml`**, and **`<aggregate>.types.ts`** files.

## Key Generation Rules

### 1. Imports Section
Start with required imports:
```typescript
import { Decider } from "../../decider";
import { randomUUID } from "crypto";
import { T<Aggregate>Decider, /* specific types */ } from "./<aggregate>.types";
```

### 2. Preconditions Implementation
Create preconditions object from lifecycle and assertions:
- **Structure**: `{ 'command-type': [precondition array] }`
- **Format**: `['Description', (dm) => boolean, 'failure_code']`
- **Sources**: Lifecycle preconditions + assertions preconditions
- **Logic**: Convert assertion expressions to executable functions
- **Type Safety**: Use proper type guards and casting

### 3. Branches Implementation  
Create branches object from lifecycle operations:
- **Structure**: `{ 'command-type': [branch array] }`
- **Format**: `['Condition', (dm) => boolean, (dm) => Event]`
- **Sources**: Lifecycle branches conditions and outcomes
- **Logic**: Convert assertion branching_conditions to executable functions
- **Events**: Generate events matching lifecycle `then` outcomes

### 4. Evolutions Implementation
Create evolutions object from events:
- **Structure**: `{ 'event-type': (em) => NewState }`
- **Sources**: All event types from lifecycle `then` fields
- **Logic**: Apply event data to evolve state according to outcome assertions
- **State Transitions**: Handle status changes and field updates properly

### 5. Helper Functions
Create utility functions based on assertions:
- Extract validation logic from assertion expressions
- Create reusable functions for common patterns
- Implement business rule checks
- Add type-safe helper functions

### 6. Decider Export
Export the configured decider instance:
```typescript
export const <Aggregate>Decider: Decider<T<Aggregate>Decider> = new Decider(
  preconditions,
  branches,
  evolutions
);
```

## Implementation Patterns

### Preconditions Pattern
```typescript
export const preconditions: T<Aggregate>Decider['preconditions'] = {
  'command-type': [
    ['Human description', (dm) => {
      // Convert assertion expression to executable logic
      // Use type guards: dm.cmd.type === 'command-type'
      // Return boolean result
    }, 'failure_code'],
  ],
};
```

### Branches Pattern
```typescript
export const branches: T<Aggregate>Decider['branches'] = {
  'command-type': [
    [
      'Condition description',
      (dm) => {
        // Convert branching condition to executable logic
        // Cast command: const cmd = dm.cmd as SpecificCmd;
        // Return boolean
      },
      (dm) => {
        // Generate event from command data
        // Cast command: const cmd = dm.cmd as SpecificCmd;
        // Return properly typed event
        return {
          type: 'event-type',
          data: { /* extracted from cmd */ }
        } satisfies SpecificEvt;
      },
    ],
  ],
};
```

### Evolutions Pattern
```typescript
const evolutions: T<Aggregate>Decider['evolutions'] = {
  'event-type': (em) => {
    const e = em.evt as SpecificEvt;
    const state = em.state as CurrentState; // if updating existing
    
    // For new state creation
    return {
      // Apply event data to create new state
      // Follow outcome assertions requirements
    } satisfies NewState;
    
    // For state updates
    return {
      ...state,
      // Apply changes from event
      updatedAt: Date.now(),
    } satisfies UpdatedState;
  },
};
```

## Data Extraction Rules

### From Lifecycle YAML:
- **Operations** → Preconditions and branches structure
- **Preconditions** → Individual precondition checks with descriptions
- **Branches** → Conditional logic and event generation
- **When/Then** → Command types and event types mapping

### From Assertions YAML:
- **Preconditions** → Executable boolean expressions
- **Branching_conditions** → Decision logic implementation
- **Outcome_assertions** → State evolution requirements
- **Helper function references** → Function implementations needed

### From Types TypeScript:
- **Command types** → Type casting and data access
- **Event types** → Event generation templates
- **State types** → Evolution return types
- **Failure types** → Error codes for preconditions

## Helper Function Implementation

Based on assertion expressions, create functions like:

```typescript
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password: string): boolean {
  // Extract pattern from types.ts validation rules
  return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
}

function hasCompleteName(profile: { firstName: string; lastName: string }): boolean {
  return !!profile.firstName && !!profile.lastName;
}

function generateId(): string {
  return randomUUID();
}

function hashPassword(password: string): string {
  // In real implementation, use bcrypt
  return `hashed_${password}`;
}
```

## Conversion Rules

### Assertion Expression → Implementation:
- `state === null` → `(dm) => dm.state === undefined`
- `state?.status === 'active'` → `(dm) => dm.state?.status === 'active'`
- `cmd.payload.email` → `(dm) => dm.cmd.type === 'cmd-type' && dm.cmd.data.email`
- `cmd.metadata.emailIsAvailable === true` → `(dm) => dm.cmd.type === 'cmd-type' && dm.cmd.data.emailIsAvailable`

### State Evolution Rules:
- Apply event data to state fields
- Update timestamps (createdAt, updatedAt)
- Handle status transitions
- Preserve unchanged fields
- Follow outcome assertion requirements

## Type Safety Requirements

1. **Command Type Guards**: Always check `dm.cmd.type` before casting
2. **State Type Guards**: Use proper type assertions for state evolution
3. **Event Satisfaction**: Use `satisfies EventType` for type checking
4. **Helper Function Types**: Match TypeScript types from types.ts file

## Business Logic Mapping

### From Lifecycle Operations:
1. **CreateUser** → New state creation with generated ID
2. **UpdateUser** → State modification preserving unchanged fields  
3. **ChangePassword** → Password hash update with timestamp
4. **DeactivateUser** → Status change with deactivation data
5. **ReactivateUser** → Status restoration clearing deactivation

### Outcome Assertion Compliance:
- Each evolution must satisfy all `andOutcome` assertions
- Generate proper timestamps and IDs
- Preserve data integrity during transitions
- Handle optional fields correctly

## Code Structure Requirements

1. **Imports** - Framework and type imports
2. **Preconditions Export** - Typed preconditions object
3. **Branches Export** - Typed branches object  
4. **Evolutions Const** - Typed evolutions object
5. **Helper Functions** - Utility function implementations
6. **Decider Export** - Configured decider instance

## Quality Requirements

- **Type Safety**: Complete TypeScript compliance with no `any` types
- **Business Logic**: Faithful implementation of lifecycle behavior
- **Performance**: Pure functions with no side effects in decider logic
- **Maintainability**: Clear structure matching specification files
- **Testability**: Deterministic functions that can be unit tested
- **Documentation**: Comments explaining complex business logic

Generate a complete decider implementation that provides executable business logic while maintaining perfect alignment with the lifecycle specification and assertion requirements.