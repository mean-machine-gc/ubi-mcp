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

Generate **multiple test files** organized by use case from the provided YAML specifications and reference TypeScript implementation.

## Source Files to Use

Use **ALL FOUR** files for comprehensive test generation:
1. **`<aggregate>.lifecycle.yaml`** - Operations, guards, preconditions, and business flow
2. **`<aggregate>.assertions.yaml`** - Implementation specifications and executable assertions  
3. **`<aggregate>.types.ts`** - TypeScript type definitions and contracts
4. **`<aggregate>.decider.ts`** - TypeScript implementation (for structure and helper functions)

## Output File Structure

Generate these files:
```
__tests__/
├── shared-helpers.ts          # Common utilities and test data
├── <operation1>.spec.ts    # operation tests
├── <operation2>.spec.ts    # another operation tests  
├── # more <operation>.spec.ts for remaining operations
```

## Shared Helpers File Template

```typescript
// shared-helpers.ts
import { <Aggregate>Decider } from '../<aggregate>.decider';
import { <Aggregate>Cmd, <Aggregate>, <Aggregate>Failures, /* specific state types */ } from '../<aggregate>.types';

// Decision model type for testing
type DecisionModel = {
  cmd: <Aggregate>Cmd;
  state: <Aggregate> | undefined;
};

// Test helper functions
export const createDM = <C extends <Aggregate>Cmd>(cmd: C, state?: <Aggregate>): DecisionModel => 
  ({ cmd, state });

export const runPreconditions = (cmd: <Aggregate>Cmd, state?: <Aggregate>) => {
  const dm = createDM(cmd, state);
  const cmdType = cmd.type;
  const preconditions = <Aggregate>Decider.preconditions[cmdType] || [];
  
  for (const [description, check, failureCode] of preconditions) {
    if (!check(dm)) {
      return { success: false, failureCode, description };
    }
  }
  return { success: true };
};

export const runBranch = (cmd: <Aggregate>Cmd, state?: <Aggregate>) => {
  const dm = createDM(cmd, state);
  const cmdType = cmd.type;
  const branches = <Aggregate>Decider.branches[cmdType] || [];
  
  for (const [description, condition, eventFactory] of branches) {
    if (condition(dm)) {
      return { matched: true, description, event: eventFactory(dm) };
    }
  }
  return { matched: false };
};

export const evolveState = (event: any, currentState?: <Aggregate>) => {
  const evolution = <Aggregate>Decider.evolutions[event.type];
  if (!evolution) throw new Error(`No evolution for event type: ${event.type}`);
  
  return evolution({ evt: event, state: currentState });
};

// Common test data
export const validIds = {
  userId: 'user-123456789',
  generatedId: /^[a-f0-9-]{36}$/,  // UUID pattern
};

export const validEmails = {
  standard: 'test@example.com',
  withSubdomain: 'user@mail.example.com',
  unicode: 'user@exämple.com',
};

export const validPasswords = {
  standard: 'Password123!',
  complex: 'MyV3ryC0mpl3x!Pass',
  minimal: 'Pass123!',
};

export const validProfiles = {
  complete: {
    firstName: 'John',
    lastName: 'Doe',
    avatar: 'https://example.com/avatar.jpg',
  },
  minimal: {
    firstName: 'Jane',
    lastName: 'Smith',
  },
};

export const sampleStates = {
  activeUser: {
    id: validIds.userId,
    email: validEmails.standard,
    status: 'active' as const,
    createdAt: Date.now() - 86400000, // 1 day ago
    updatedAt: Date.now() - 3600000,  // 1 hour ago
    profile: validProfiles.complete,
    passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456789',
    passwordUpdatedAt: Date.now() - 86400000,
  },
  inactiveUser: {
    id: validIds.userId,
    email: validEmails.standard,
    status: 'inactive' as const,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 3600000,
    deactivatedAt: Date.now() - 1800000, // 30 minutes ago
    deactivationReason: 'User requested account closure',
    profile: validProfiles.complete,
    passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456789',
  },
};

// Common assertion helpers
export const expectPreconditionSuccess = (result: ReturnType<typeof runPreconditions>) => {
  expect(result.success).toBe(true);
  return result.success;
};

export const expectPreconditionFailure = (
  result: ReturnType<typeof runPreconditions>, 
  expectedFailure: <Aggregate>Failures
) => {
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.failureCode).toBe(expectedFailure);
    return true;
  }
  return false;
};

export const expectBranchMatch = (result: ReturnType<typeof runBranch>) => {
  expect(result.matched).toBe(true);
  return result.matched;
};

export const expectValidEvent = (event: any, expectedType: string) => {
  expect(event).toBeDefined();
  expect(event.type).toBe(expectedType);
  expect(event.data).toBeDefined();
  return true;
};

export const expectValidState = (state: any, expectedStatus?: string) => {
  expect(state).toBeDefined();
  expect(state.id).toBeDefined();
  expect(state.email).toBeDefined();
  expect(state.createdAt).toBeGreaterThan(0);
  expect(state.updatedAt).toBeGreaterThan(0);
  expect(state.profile).toBeDefined();
  expect(state.passwordHash).toBeDefined();
  
  if (expectedStatus) {
    expect(state.status).toBe(expectedStatus);
  }
  
  return true;
};
```

## Individual Test File Template

```typescript
// operation-name.spec.ts
import { <Operation>Cmd, <Aggregate>Evt } from '../<aggregate>.types';
import { 
  runPreconditions, 
  runBranch, 
  evolveState,
  expectPreconditionSuccess,
  expectPreconditionFailure,
  expectBranchMatch,
  expectValidEvent,
  expectValidState,
  validIds,
  validEmails,
  validPasswords,
  validProfiles,
  sampleStates
} from './shared-helpers';

describe('<Operation> Use Case', () => {
  const createValidCmd = (overrides?: Partial<<Operation>Cmd['data']>): <Operation>Cmd => ({
    type: 'operation-name',
    data: { 
      // Include valid defaults from types.ts
      ...overrides 
    }
  });

  describe('Success Scenarios', () => {
    it('should pass all preconditions with valid data', () => {
      const cmd = createValidCmd();
      const result = runPreconditions(cmd, /* appropriate state */);
      
      expectPreconditionSuccess(result);
    });

    it('should generate correct event when conditions are met', () => {
      const cmd = createValidCmd();
      const result = runBranch(cmd, /* appropriate state */);
      
      expectBranchMatch(result);
      if (result.matched) {
        expectValidEvent(result.event, 'expected-event-type');
        // Verify event data matches command data
      }
    });

    it('should evolve state correctly', () => {
      const cmd = createValidCmd();
      const branchResult = runBranch(cmd, /* appropriate state */);
      
      if (branchResult.matched) {
        const newState = evolveState(branchResult.event, /* current state */);
        expectValidState(newState, 'expected-status');
        // Verify specific outcome assertions from lifecycle.yaml
      }
    });
  });

  describe('Failure Scenarios', () => {
    describe('Precondition Failures', () => {
      // Generate test for each precondition from assertions.yaml
      it('should fail when [specific precondition not met]', () => {
        const cmd = createValidCmd({ /* data that violates precondition */ });
        const result = runPreconditions(cmd, /* appropriate state */);
        
        expectPreconditionFailure(result, 'expected_failure_code');
      });
    });

    describe('Business Rule Violations', () => {
      // Additional business logic failure tests
    });
  });

  describe('Edge Cases', () => {
    describe('Data Validation', () => {
      // Test validation patterns from types.ts
    });

    describe('State Immutability', () => {
      it('should not modify original state during processing', () => {
        const originalState = { ...sampleStates.activeUser };
        const cmd = createValidCmd();
        
        runPreconditions(cmd, originalState);
        
        expect(originalState).toEqual(sampleStates.activeUser);
      });
    });
  });
});
```

## Key Testing Requirements

### 1. Success Scenarios
- **Test each branch** from lifecycle.yaml that leads to success
- **Verify event generation** matches types.ts event shapes
- **Verify state evolution** follows outcome assertions from assertions.yaml
- **Check data integrity** - all `andOutcome` items from lifecycle.yaml
- **Validate timestamps** and generated fields (IDs, hashes)

### 2. Failure Scenarios  
- **Test each precondition** from assertions.yaml individually
- **Verify failure codes** match types.ts failure enum values
- **Test guard failures** via invalid metadata in commands
- **Test multiple precondition failures** (first one should trigger)

### 3. Edge Cases
- **State immutability** - original state unchanged during processing
- **Data validation boundaries** - test validation patterns from types.ts
- **Optional fields handling** - missing vs empty vs null values
- **Timestamp validation** - proper timing of generated timestamps
- **Business rule edge cases** - boundary conditions for business logic

## Test Organization Patterns

### 1. Use Command Builders
```typescript
const createValidCmd = (overrides?: Partial<CmdType['data']>): CmdType => ({
  type: 'cmd-type',
  data: { validDefaults, ...overrides }
});
```

### 2. Group Related Tests
```typescript
describe('Success Scenarios', () => { 
  describe('Valid Input Variations', () => { /* ... */ });
});
describe('Failure Scenarios', () => {
  describe('Precondition Failures', () => { /* ... */ });
  describe('Business Rule Violations', () => { /* ... */ });
});
describe('Edge Cases', () => {
  describe('Data Validation', () => { /* ... */ });
  describe('State Immutability', () => { /* ... */ });
});
```

### 3. Use Descriptive Test Names
```typescript
it('should fail when user does not exist', () => { /* ... */ });
it('should preserve unchanged profile fields during update', () => { /* ... */ });
it('should generate unique ID for new entity', () => { /* ... */ });
it('should validate email format according to pattern', () => { /* ... */ });
```

## Mapping Rules

### From lifecycle.yaml:
- **Operations** → Test file names and describe blocks
- **Guards** → Metadata validation test scenarios
- **Preconditions** → Precondition failure tests
- **Branches** → Success scenario branch testing
- **andOutcome items** → Specific state evolution assertions

### From assertions.yaml:
- **Guards** → External service mock requirements
- **Preconditions** → Individual failure test cases with exact expressions
- **Branching_conditions** → Branch condition testing
- **Outcome_assertions** → Success scenario validations (assert + description)

### From types.ts:
- **Command shapes** → Test data structure and command builders
- **Event shapes** → Event assertion structure and validation
- **State shapes** → State validation and sample data creation
- **Failure enum** → Expected failure reason values
- **Validation patterns** → Edge case testing (@pattern, @minLength, etc.)

### From decider.ts:
- **Preconditions structure** → Test execution patterns
- **Branches structure** → Branch testing approach
- **Evolutions structure** → State evolution testing
- **Helper functions** → Edge case validation scenarios and mocking

## Quality Requirements

- **Complete coverage**: Every precondition, branch, and evolution tested
- **Type safety**: Proper TypeScript usage throughout tests
- **Maintainability**: Clear test organization with shared helpers
- **Reliability**: Deterministic tests with proper data setup
- **Performance**: Efficient test execution with reusable utilities
- **Documentation**: Self-documenting test descriptions matching business requirements
- **Business accuracy**: Tests reflect actual business rules from YAML specifications

Generate all test files following this structure, ensuring comprehensive coverage of all business scenarios, failure cases, and edge conditions defined in the YAML specifications and TypeScript implementation.