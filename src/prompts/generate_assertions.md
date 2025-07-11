# Generate Aggregate Assertions YAML from Lifecycle YAML

## Context & Purpose

You are helping to implement an **event-driven, aggregate-based architecture** where business logic is specified through YAML files. We need to generate implementation specifications from high-level business behavior definitions.

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

Generate a complete **`<aggregate>.assertions.yaml`** file from the provided **`<aggregate>.lifecycle.yaml`** file.

## Key Transformation Rules

### 1. Guards Section
Transform lifecycle guards into implementation specifications:
- **Authentication/Authorization guards** → async operations for Inbox layer
- **External system checks** → preconditions with pre-resolved boolean metadata
- Use `await` for async operations that can't be reduced to booleans

### 2. Preconditions Section
Extract all preconditions and add external system checks:
- **State validation** → pure functions (`state === null`, `state?.status === 'active'`)
- **Command validation** → pure functions (`isValidEmail(cmd.data.email)`)
- **External system checks** → boolean metadata checks (`cmd.metadata.emailIsAvailable === true`)
- **Business logic** → pure functions with helper functions

### 3. Branching Conditions Section
Convert lifecycle branches:
- **Complex conditions** → pure functions based on cmd/state
- **Simple success paths** → use `always: "true"` convention
- Only include conditions that appear in lifecycle branches

### 4. Outcome Assertions Section
Create assertions for **every** `andOutcome` item in lifecycle:
- Each outcome becomes a testable assertion with `assert` and `description`
- Assertions should validate the specific business outcome
- Use helper functions like `isBcryptHash()`, `deepEqual()`, etc.

### 5. Invariants Assertion Section
Create a comprehensive invariants validator:
- Pattern match on state shape using `state.status`
- Validate all global invariants for every state
- Validate state-specific invariants based on status
- Include transition validation logic

## Naming Conventions

- **Commands/Events**: Use kebab-case (`create-user`, `user-created`)
- **Functions**: Use camelCase (`isValidEmail`, `hasCompleteName`)
- **Properties**: Use camelCase (`cmd.data.email`, `state.passwordHash`)
- **Metadata**: Use camelCase (`cmd.metadata.emailIsAvailable`)

## Data Structure Assumptions

- Commands have `cmd.data` (not `cmd.payload`)
- External checks are pre-resolved as `cmd.metadata.{checkName}` boolean values
- States have status property indicating current state
- Helper functions available: `isValidEmail`, `isBcryptHash`, `deepEqual`, `daysSinceDeactivation`, etc.

## Important Implementation Details

1. **External System Checks**: Move from guards to preconditions, check pre-resolved metadata
2. **Failure Handling**: Don't include - handled by standardized framework
3. **Pure Functions**: All preconditions and branching must be pure (no side effects)
4. **Complete Coverage**: Every lifecycle `andOutcome` needs a corresponding assertion
5. **State Validation**: Invariants must cover all states defined in lifecycle

## Example Input/Output Structure

**Input**: `user.lifecycle.yaml` with operations, guards, preconditions, branches, and invariants

**Output**: `user.assertions.yaml` with:
- `guards` (async operations)
- `preconditions` (pure functions + external checks as metadata)
- `branching_conditions` (pure decision logic)
- `outcome_assertions` (validates each andOutcome item)
- `invariants_assertion` (comprehensive state validation)

## Quality Requirements

- **Complete mapping**: Every lifecycle element has corresponding implementation
- **Executable**: All assertions are valid JavaScript/TypeScript expressions
- **Testable**: Assertions can drive automated testing
- **Maintainable**: Clear descriptions and logical organization
- **Type-safe**: Proper handling of optional fields and state variations

Generate the assertions file following these specifications exactly, ensuring complete coverage of all lifecycle behavior.
