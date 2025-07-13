# Aggregate Test Coverage Analysis

## Context & Purpose

You are analyzing the **test coverage completeness** for an event-driven aggregate implementation. Your task is to verify that the test suite comprehensively covers all business scenarios, failure cases, and edge conditions defined in the specification files.

## Architecture Overview

The aggregate follows **specification-driven testing**:
- **lifecycle.yaml** defines business operations and success paths
- **assertions.yaml** defines preconditions and outcome validations
- **types.ts** defines data shapes and validation patterns
- **decider.ts** contains the implementation being tested
- **Test files** should cover ALL scenarios from the above specifications

## Your Task

Perform a **comprehensive test coverage analysis** to identify missing test scenarios and ensure complete behavioral verification of the aggregate.

## Coverage Analysis Framework

### 1. Business Operation Coverage

**Success Path Coverage:**
- Every operation in lifecycle.yaml should have success scenario tests
- Every branch condition in lifecycle.yaml should be tested
- Every `andOutcome` item in lifecycle.yaml should be verified in tests
- All state transitions defined in lifecycle.yaml should be covered

**Command Variation Coverage:**
- All command types from types.ts should have test cases
- All required fields should be tested with valid values
- All optional fields should be tested with/without values
- Command builders should cover all data shape variations

### 2. Failure Scenario Coverage

**Precondition Failure Coverage:**
- Every precondition in assertions.yaml should have a dedicated failure test
- Every failure code in types.ts should be tested
- Each precondition should be tested in isolation (single failure)
- Multiple precondition failures should be tested (first failure wins)

**Validation Failure Coverage:**
- Every validation pattern in types.ts (@pattern, @minLength, etc.) should be tested
- Boundary conditions for all constraints should be covered
- Invalid data formats should trigger appropriate failures
- Edge cases for optional field validation should be tested

**Business Rule Violation Coverage:**
- Every guard condition that can fail should be tested
- State-dependent failures should be covered (wrong status, etc.)
- External dependency failures should be simulated (metadata flags)
- Business invariant violations should be tested

### 3. State Evolution Coverage

**Event Application Coverage:**
- Every event type from types.ts should have evolution tests
- All state transitions should be verified for correctness
- Timestamp generation and updates should be validated
- Field preservation during transitions should be tested

**Outcome Assertion Coverage:**
- Every outcome assertion from assertions.yaml should be verified
- State changes should match lifecycle.yaml andOutcome specifications
- Immutability of unchanged fields should be tested
- Generated fields (IDs, hashes, timestamps) should be validated

### 4. Edge Case and Data Validation Coverage

**Type Safety Coverage:**
- All TypeScript types should be exercised in tests
- Type narrowing scenarios should be tested
- Union type handling should be covered
- Optional vs required field scenarios should be tested

**Helper Function Coverage:**
- All helper functions referenced in assertions.yaml should be tested
- Validation functions should have edge case tests
- Business logic helpers should cover boundary conditions
- Utility functions should be tested independently

**Data Boundary Coverage:**
- Minimum and maximum values for constrained fields
- Empty strings, nulls, and undefined values where applicable
- Unicode and special character handling
- Large data payloads and performance implications

## Specific Coverage Patterns to Verify

### Critical Coverage Requirements
1. **Every Precondition**: Each assertion has at least one test that violates it
2. **Every Success Branch**: Each lifecycle branch has a test that triggers it
3. **Every State Transition**: All valid state changes are tested
4. **Every Failure Code**: All possible failure reasons are exercised
5. **Every Outcome Assertion**: All business outcomes are verified

### Comprehensive Coverage Requirements
1. **Command Data Variations**: All field combinations tested
2. **State Variants**: Tests for each aggregate status (active, inactive, etc.)
3. **Event Data Verification**: All event payloads validated
4. **Cross-Operation Scenarios**: State changes affecting subsequent operations
5. **Concurrency Considerations**: State immutability during processing

### Advanced Coverage Requirements
1. **Performance Edge Cases**: Large datasets, complex operations
2. **Security Scenarios**: Input sanitization, injection prevention
3. **Accessibility**: Error messages are clear and actionable
4. **Monitoring**: Key metrics can be extracted from test outcomes

## Coverage Analysis Output Format

### Coverage Summary
```
TEST COVERAGE ANALYSIS
======================
Total Scenarios Identified: X
Scenarios Covered: Y
Coverage Percentage: Z%
Critical Gaps: A
Missing Scenarios: B
Overall Assessment: [EXCELLENT|GOOD|NEEDS_IMPROVEMENT|INSUFFICIENT]
```

### Coverage Matrix

**Operation Coverage Matrix:**
```
OPERATION COVERAGE MATRIX
=========================
Operation      | Success | Precond | Outcomes | Edge Cases | Status
create-user    |   ✓     |   3/3   |   5/5    |     ✓      | COMPLETE
update-user    |   ✓     |   2/4   |   4/4    |     ⚠      | GAPS
delete-user    |   ✗     |   0/3   |   0/2    |     ✗      | MISSING
```

**Failure Coverage Matrix:**
```
FAILURE COVERAGE MATRIX
=======================
Failure Code               | Test Exists | Test Quality | Notes
user_already_exists        |      ✓      |    GOOD      | -
email_not_available        |      ✓      |    GOOD      | -
invalid_email              |      ⚠      |    BASIC     | Missing edge cases
password_requirements_not_met |    ✗      |     -        | No test found
```

### Detailed Gap Analysis

For each missing or insufficient test coverage:

```
COVERAGE GAP: Brief Description
Category: [SUCCESS_PATH|PRECONDITION|OUTCOME|EDGE_CASE|VALIDATION]
Specification Source: lifecycle.yaml line X / assertions.yaml section Y
Current Coverage: [MISSING|PARTIAL|INADEQUATE]
Risk Level: [HIGH|MEDIUM|LOW]

Missing Scenarios:
- Specific scenario 1 that should be tested
- Specific scenario 2 that should be tested

Recommended Tests:
- Specific test case description with expected behavior
- Test data suggestions and expected outcomes

Implementation Priority: [CRITICAL|HIGH|MEDIUM|LOW]
```

### Test Quality Assessment

**Existing Test Quality:**
- Are test descriptions clear and business-focused?
- Do tests use proper assertion helpers and shared utilities?
- Are test data builders comprehensive and maintainable?
- Do tests properly isolate scenarios (one concern per test)?

**Test Organization Assessment:**
- Are tests grouped logically by use case?
- Do test files align with operation boundaries?
- Are shared helpers properly utilized?
- Is test data management effective?

## Recommendations Format

### Immediate Actions (Critical Gaps)
```
CRITICAL COVERAGE GAPS
======================
1. [Operation] - Missing precondition test for [specific condition]
   Test: it('should fail when [condition]', () => { ... })
   
2. [Operation] - Missing outcome verification for [specific outcome]
   Test: Verify state contains [expected changes] after [operation]
```

### Enhancement Opportunities (Quality Improvements)
```
TEST QUALITY IMPROVEMENTS
=========================
1. Add edge case testing for [specific validation pattern]
2. Improve test data builders for [specific command type]
3. Add performance testing for [complex operation]
4. Enhance error message validation
```

### Test Infrastructure Recommendations
```
INFRASTRUCTURE IMPROVEMENTS
===========================
1. Add property-based testing for [validation patterns]
2. Implement test data factories for [complex state scenarios]
3. Create assertion helpers for [common verification patterns]
4. Add test coverage reporting integration
```

## Analysis Guidelines

### Completeness Standards
- **100% specification coverage**: Every business rule should have tests
- **Failure path completeness**: Every failure mode should be exercised
- **Edge case coverage**: Boundary conditions should be tested
- **Integration scenarios**: Cross-operation effects should be verified

### Quality Standards
- **Business-focused**: Tests should read like business requirements
- **Maintainable**: Tests should be easy to update when specifications change
- **Reliable**: Tests should be deterministic and fast
- **Comprehensive**: Tests should catch regressions effectively

### Practical Considerations
- Consider test execution time and CI/CD impact
- Balance comprehensive coverage with maintainability
- Prioritize critical business paths and failure scenarios
- Ensure tests support debugging and troubleshooting

## Output Requirements

Your analysis should provide:
1. **Clear coverage metrics** with specific gap identification
2. **Actionable recommendations** with concrete test case suggestions
3. **Priority guidance** for addressing coverage gaps
4. **Quality assessment** of existing tests
5. **Infrastructure suggestions** for improving test maintainability

Focus on practical, implementable recommendations that improve confidence in the aggregate's correctness while maintaining test suite maintainability and execution efficiency.