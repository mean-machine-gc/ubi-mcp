# Generate Aggregate Assertions YAML from Lifecycle YAML

## Context & Purpose

You are helping to implement an **event-driven, aggregate-based architecture** where business logic is specified through YAML files. We need to generate implementation specifications from high-level business behavior definitions.

## Architecture Overview

Our system uses **3 layers** with clear separation of concerns:

1. **Inbox Layer**: Handles async operations (authentication, external system calls)
2. **Decider Layer**: Pure functions that implement business logic (no side effects)
3. **Outbox Layer**: Processes outcomes and publishes events

## File Structure

Each aggregate has **3 core files**:

1. **`<aggregate>.lifecycle.yaml`** - High-level business behavior specification
2. **`<aggregate>.assertions.yaml`** - Implementation specifications with executable assertions
3. **`<aggregate>.types.ts`** - TypeScript type definitions and contracts

## Your Task

Generate a complete **`<aggregate>.assertions.yaml`** file from the provided **`<aggregate>.lifecycle.yaml`** file.

## Key Transformation Rules

### 1. Guards Section
Transform lifecycle guards into implementation specifications:
- **Authentication/Authorization guards** → async operations for Inbox layer using `await`
- **External system checks** → moved to preconditions with pre-resolved boolean metadata
- Format: `guard_name: "await service.method(params)"`

### 2. Preconditions Section
Extract all preconditions from lifecycle operations and add external system checks:
- **State validation** → pure functions (`state === null`, `state?.status === 'active'`)
- **Command validation** → pure functions (`isValidEmail(cmd.payload.email)`)
- **External system checks** → boolean metadata checks (`cmd.metadata.emailIsAvailable === true`)
- **Business logic** → pure functions with helper functions
- Format: `precondition_name: "expression"`

### 3. Branching Conditions Section
Convert lifecycle `branches` conditions into executable expressions:
- **Complex conditions** → pure functions based on cmd/state
- **Simple success paths** → use `always: "true"` convention
- Only include conditions that appear in lifecycle `branches`
- Format: `condition_name: "expression"`

### 4. Outcome Assertions Section
Create assertions for **every** `andOutcome` item in lifecycle operations:
- Each outcome becomes a testable assertion with `assert` and `description` fields
- Assertions should validate the specific business outcome described
- Use helper functions like `isBcryptHash()`, `deepEqual()`, `verifyPassword()`, etc.
- Reference previous state as `previousState` when needed
- Format:
  ```yaml
  outcome_name:
    assert: "assertion_expression"
    description: "Human readable description"
  ```

## Naming Conventions

- **Commands/Events**: Use kebab-case (`create-user`, `user-created`)
- **Functions**: Use camelCase (`isValidEmail`, `hasCompleteName`)
- **Properties**: Use camelCase (`cmd.payload.email`, `state.passwordHash`)
- **Metadata**: Use camelCase (`cmd.metadata.emailIsAvailable`)
- **Guards/Preconditions**: Use snake_case (`user_is_authenticated`, `email_is_available`)

## Data Structure Assumptions

Based on the provided examples:

- Commands have `cmd.payload` for main data and `cmd.metadata` for pre-resolved checks
- Authentication context available as `authContext.userId`
- States have status property indicating current state
- Helper functions available: `isValidEmail`, `isValidPassword`, `isBcryptHash`, `deepEqual`, `daysSinceDeactivation`, `hasCompleteName`, `isValidUpdateData`, `verifyPassword`, etc.
- Previous state available as `previousState` in outcome assertions

## Important Implementation Details

1. **External System Checks**: Move from guards to preconditions, check pre-resolved metadata
2. **Command Data Access**: Use `cmd.payload` for main command data, `cmd.data` in outcome assertions
3. **Pure Functions**: All preconditions and branching must be pure (no side effects)
4. **Complete Coverage**: Every lifecycle `andOutcome` needs a corresponding assertion
5. **State Validation**: Cover all state transitions and business rules
6. **Async Operations**: Only in guards section, everything else must be synchronous

## Example Structure Mapping

**Lifecycle Format**:
```yaml
operations:
  - name: CreateUser
    guards:
      - user_is_authenticated
    when: create-user
    preconditions:
      - user_does_not_exist
      - email_is_available
    branches:
      - condition: user_data_is_complete
        then: user-created
        andOutcome: 
          - user_state_is_active
          - user_id_is_generated
```

**Assertions Format**:
```yaml
guards:
  user_is_authenticated: "await authService.verifyToken(cmd.metadata.token)"

preconditions:
  user_does_not_exist: "state === null"
  email_is_available: "cmd.metadata.emailIsAvailable === true"

branching_conditions:
  user_data_is_complete: "hasCompleteName(cmd.payload.profile)"

outcome_assertions:
  user_state_is_active:
    assert: "state.status === 'active'"
    description: "User status must be set to active"
  user_id_is_generated:
    assert: "state.id && typeof state.id === 'string' && state.id.length > 0"
    description: "User ID must be generated and non-empty"
```

## Quality Requirements

- **Complete mapping**: Every lifecycle element has corresponding implementation
- **Executable**: All assertions are valid JavaScript/TypeScript expressions
- **Testable**: Assertions can drive automated testing
- **Maintainable**: Clear descriptions and logical organization
- **Type-safe**: Proper handling of optional fields and state variations
- **Consistent**: Follow the exact naming and structure conventions shown in examples

## Output Format

Generate the assertions file with these exact sections in this order:
1. `aggregate` and `version` headers
2. `guards` - async operations (if any)
3. `preconditions` - pure validation functions
4. `branching_conditions` - decision logic
5. `outcome_assertions` - validation of business outcomes

Each section should use the yaml structure shown in the examples, with proper indentation and quoting of expressions.

Generate the assertions file following these specifications exactly, ensuring complete coverage of all lifecycle behavior.