



# Generate Aggregate Decider Test Suite from YAML Specifications

## Context & Purpose

You are generating **Jest test suites** for TypeScript decider implementations in an event-driven, aggregate-based architecture. The tests should be **split by use case** into separate files for better organization and maintainability.

## Architecture Overview

Our system uses **3 layers**:
1. **Inbox Layer**: Handles async operations
2. **Decider Layer**: Pure functions implementing business logic (your test target)
3. **Outbox Layer**: Processes outcomes and publishes events

The decider follows this pattern: **Commands → Preconditions → Branches → Events → State Evolution**

## Your Task

Generate **multiple test files** organized by use case from the provided YAML specifications and reference TypeScript decider.


## Source Files to Use

Use **ALL THREE** YAML files plus the **TypeScript decider**:
1. **`<aggregate>.lifecycle.yaml`** - Operations and business flow
2. **`<aggregate>.assertions.yaml`** - Preconditions and failure cases  
3. **`<aggregate>.decider.yaml`** - Data shapes and contracts
4. **`<aggregate>.decider.ts`** - TypeScript implementation (for type references)

## Output File Structure

Generate these files:
```
__tests__/
├── shared-helpers.ts          # Common utilities and test data
├── create-<entity>.spec.ts    # Create operation tests
├── update-<entity>.spec.ts    # Update operation tests  
├── change-<specific>.spec.ts  # Specific operation tests
├── deactivate-<entity>.spec.ts # Deactivate operation tests
└── reactivate-<entity>.spec.ts # Reactivate operation tests
```

## Shared Helpers File Template

```typescript
// shared-helpers.ts
import { DecisionModel } from '../../../types';
import { AggregateCmd, Aggregate, AggregateDecider, /* state types */ } from '../aggregate.decider';

// Test helper functions
export const createDM = <C extends AggregateCmd>(cmd: C, state?: Aggregate) => ({ cmd, state });
export const runDecider = <C extends AggregateCmd>(cmd: C, state?: Aggregate) => 
  AggregateDecider.run(createDM(cmd, state));

// Common test data
export const validData = { /* ... */ };
export const sampleStates = { /* ... */ };

// Common assertion helpers
export const expectSuccess = (result: any) => {
  expect(result.outcome).toBe('success');
  return result.outcome === 'success';
};

export const expectFailure = (result: any, expectedReason: string) => {
  expect(result.outcome).toBe('fail');
  if (result.outcome === 'fail') {
    expect(result.evts[0].type).toBe('operation-failed');
    expect(result.evts[0].data.reason).toBe(expectedReason);
    return true;
  }
  return false;
};
```

## Individual Test File Template

```typescript
// operation-name.spec.ts
import { OperationCmd } from '../aggregate.decider';
import { runDecider, sampleStates, expectSuccess, expectFailure } from './shared-helpers';

describe('OperationName Use Case', () => {
  const createValidCmd = (overrides?: Partial<OperationCmd['data']>) => ({
    type: 'operation-name',
    data: { /* defaults */ ...overrides }
  });

  describe('Success Scenarios', () => {
    // Test each successful path from lifecycle.yaml branches
  });

  describe('Failure Scenarios', () => {
    describe('Precondition Failures', () => {
      // Test each precondition from assertions.yaml
    });
  });

  describe('Edge Cases', () => {
    // Additional validation and boundary tests
  });
});
```

## Key Testing Requirements

### 1. Success Scenarios
- **Test each branch** from lifecycle.yaml that leads to success
- **Verify event generation** matches expected event shapes
- **Verify state evolution** follows business rules
- **Check data integrity** (outcomes from lifecycle.yaml)
- **Validate timestamps** and generated fields

### 2. Failure Scenarios  
- **Test each precondition** from assertions.yaml individually
- **Verify failure reasons** match expected failure enum values
- **Check operation-failed events** contain original command
- **Test multiple precondition failures** (first one should trigger)

### 3. Edge Cases
- **State immutability** - original state unchanged
- **Data validation boundaries** - edge values for validation rules
- **Optional fields handling** - missing vs empty vs null
- **Timestamp validation** - proper timing of generated timestamps

## Test Organization Patterns

### 1. Use Command Builders
```typescript
const createValidCmd = (overrides?: Partial<CmdType['data']>) => ({
  type: 'cmd-type',
  data: { validDefaults, ...overrides }
});
```

### 2. Group Related Tests
```typescript
describe('Success Scenarios', () => { /* ... */ });
describe('Failure Scenarios', () => {
  describe('Precondition Failures', () => { /* ... */ });
  describe('Business Rule Violations', () => { /* ... */ });
});
describe('Edge Cases', () => { /* ... */ });
```

### 3. Use Descriptive Test Names
```typescript
it('should fail if user does not exist', () => { /* ... */ });
it('should preserve unchanged profile fields during update', () => { /* ... */ });
it('should generate unique ID for new entity', () => { /* ... */ });
```

## Mapping Rules

### From lifecycle.yaml:
- **Operations** → Test file names and describe blocks
- **Branches** → Success scenario tests  
- **andOutcome items** → Specific assertions to verify

### From assertions.yaml:
- **Preconditions** → Individual failure test cases
- **Outcome assertions** → Success scenario validations
- **Guards** → External check failure tests (via command data)

### From decider.yaml:
- **Command shapes** → Test data structure and validation
- **Event shapes** → Event assertion structure  
- **State shapes** → State validation and sample data

### From TypeScript decider:
- **Failure enum** → Expected failure reason values
- **Helper functions** → Edge case validation scenarios
- **Type definitions** → Proper typing in tests

## Quality Requirements

- **Complete coverage**: Every precondition and branch tested
- **Type safety**: Proper TypeScript usage throughout
- **Maintainability**: Clear test organization and naming
- **Reliability**: Deterministic tests with proper setup/teardown
- **Performance**: Efficient test execution with shared helpers
- **Documentation**: Self-documenting test descriptions

Generate all test files following this structure, ensuring comprehensive coverage of all business scenarios, failure cases, and edge conditions defined in the YAML specifications.