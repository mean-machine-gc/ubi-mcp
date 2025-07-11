# Generate Aggregate Scenarios Documentation from Lifecycle YAML

## Context & Purpose

You are generating comprehensive **scenarios documentation** in Markdown format that translates technical YAML specifications into business-readable scenarios organized by use case. Each scenario must use the Given-When-Then format with meaningful, natural language names that read fluently in English.

## Your Task

Generate a **`<aggregate>-scenarios.md`** file from the provided **`<aggregate>.lifecycle.yaml`** file that documents all business scenarios organized by use case with natural, descriptive naming in Given-When-Then format.

## Source File

Use the **`<aggregate>.lifecycle.yaml`** file as the primary source, extracting:
- **Operations** → Use cases with user stories
- **Guards & Preconditions** → Failure scenarios
- **Branches** → Success scenarios  
- **Invariants** → Business rules context
- **Description fields** → Business context

## Required Document Structure

```markdown
# [Aggregate Name] Business Scenarios

## Overview
[Brief description of the aggregate's business purpose]

## Business Rules Summary
[High-level summary of key invariants and business constraints]

---

## Use Case: [Natural Language Operation Name]

### User Story
**As a** [user role]  
**I want to** [perform action in natural language]  
**So that** [achieve business goal]

### Success Scenarios

#### [Natural Descriptive Scenario Name]
**Given** [initial conditions and context]  
**When** [the action is performed]  
**Then** [expected outcome and business value]  
**And** [additional outcomes from andOutcome]

#### [Another Natural Descriptive Scenario Name]
**Given** [different initial conditions]  
**When** [the same action is performed]  
**Then** [alternative expected outcome]

### Failure Scenarios

#### [Natural Descriptive Failure Name]
**Given** [conditions that prevent success]  
**When** [the action is attempted]  
**Then** [operation is prevented/rejected]  
**And** [explanation of why it failed]

#### [Another Natural Descriptive Failure Name]
**Given** [different blocking conditions]  
**When** [the action is attempted]  
**Then** [different failure outcome]

---

[Repeat for each operation...]
```

## Transformation Guidelines

### 1. Operation to Natural Use Case Names

```yaml
# lifecycle.yaml
- name: CreateUser
  description: Creates a new user account
```

→

```markdown
## Use Case: Create New User Account

### User Story
**As a** system administrator  
**I want to** create new user accounts for legitimate users  
**So that** they can access the platform and maintain their personal information
```

### 2. Branches to Success Scenarios with Given-When-Then

```yaml
# lifecycle.yaml
branches:
  - condition: user_data_is_complete
    then: user-created
    andOutcome: 
      - user_state_is_active
      - user_id_is_generated
      - user_email_matches_command
```

→

```markdown
#### Complete Registration with All Required Information
**Given** all mandatory user information is provided and valid  
**And** the email address is available for use  
**When** the user registration is submitted  
**Then** a new active user account is created  
**And** a unique user identifier is assigned  
**And** the user can immediately access the platform
```

### 3. Guards/Preconditions to Failure Scenarios with Given-When-Then

```yaml
# lifecycle.yaml
guards:
  - user_is_authenticated
  - email_is_available
preconditions:
  - email_is_valid
  - password_meets_requirements
  - terms_accepted
```

→

```markdown
#### Unauthorized Access Attempt
**Given** the requestor is not authenticated to the system  
**When** user registration is attempted  
**Then** the operation is denied with an authentication error  
**And** no user account is created

#### Email Address Already in Use
**Given** the provided email address is already registered  
**When** user registration is attempted  
**Then** the registration is rejected  
**And** an error message indicates the email is unavailable

#### Invalid Email Format Provided
**Given** the provided email address has an invalid format  
**When** user registration is submitted  
**Then** the registration fails with a validation error  
**And** the specific format requirements are communicated

#### Weak Password Submitted
**Given** the provided password doesn't meet security requirements  
**When** user registration is attempted  
**Then** the registration is rejected  
**And** password policy requirements are displayed

#### Terms of Service Not Accepted
**Given** the user has not agreed to the terms of service  
**When** registration is submitted  
**Then** the registration cannot proceed  
**And** acceptance of terms is required before continuing
```

## Natural Language Naming Conventions

### Success Scenario Naming Patterns:
- **"Complete [Action] with [Positive Condition]"**: "Complete Registration with All Required Information"
- **"Successful [Action] for [Context]"**: "Successful Profile Update for Active Users"
- **"[Entity] [Action] with [Qualifier]"**: "User Account Creation with Valid Data"
- **"[Outcome] when [Favorable Situation]"**: "Account Activated when Verification Complete"

### Failure Scenario Naming Patterns:
- **"[Issue Description] [Action Blocked]"**: "Invalid Email Format Registration Blocked"
- **"[Security/Rule] Violation [Detected]"**: "Password Policy Violation Detected"
- **"[Resource] [Unavailability] [Error]"**: "Email Address Already in Use Error"
- **"[Authorization] [Failure] [Attempt]"**: "Unauthorized Access Attempt Rejected"
- **"[Business Rule] [Not Met]"**: "Terms of Service Not Accepted"

## Given-When-Then Structure Guidelines

### Given Section:
- Set up the initial state and context
- Include relevant business conditions
- Mention user permissions and authentication state
- Reference data availability and system state

### When Section:
- Describe the specific action being performed
- Use active voice and present tense
- Focus on the user's intent and action
- Keep it concise and action-oriented

### Then Section:
- State the primary expected outcome
- Include business value and impact
- Reference system state changes
- Use "And" for additional outcomes from `andOutcome`

## User Role Identification

Determine appropriate user roles:
- **System Administrator** - for operations requiring elevated privileges
- **Account Holder** - for self-service operations on own account
- **End User** - for general platform usage
- **Support Staff** - for customer service operations
- **Automated System** - for system-triggered operations

## Content Organization Requirements

### 1. Logical Flow
- Start with most common success scenarios
- Follow with alternative success paths
- End with failure scenarios grouped by category

### 2. Business Context
- Each scenario should explain business value
- Failure scenarios should explain business protection
- Connect technical constraints to business needs

### 3. Complete Coverage
- Every branch condition becomes a success scenario
- Every guard/precondition becomes a failure scenario
- Cover all paths through the operation

## Example Output Quality

```markdown
## Use Case: Update User Profile Information

### User Story
**As a** registered user  
**I want to** update my profile information  
**So that** my account reflects current and accurate personal details

### Success Scenarios

#### Profile Update with Valid Changes
**Given** I am an authenticated active user  
**And** I provide valid updated profile information  
**When** I submit the profile update request  
**Then** my profile is successfully updated with the new information  
**And** the system records the update timestamp  
**And** unchanged fields remain preserved

#### Partial Profile Update with Selected Fields
**Given** I am an authenticated active user  
**And** I only want to change specific profile fields  
**When** I submit updates for selected fields only  
**Then** only the specified fields are updated  
**And** all other profile information remains unchanged

### Failure Scenarios

#### Unauthorized Profile Modification Attempt
**Given** I am not authenticated to the system  
**When** I attempt to update profile information  
**Then** the update request is denied  
**And** an authentication error is returned

#### Invalid Data Format in Profile Fields
**Given** I am an authenticated user  
**And** I provide profile data that fails validation rules  
**When** I submit the profile update  
**Then** the update is rejected with validation errors  
**And** specific field requirements are communicated

#### Inactive Account Profile Update Attempt
**Given** my user account has been deactivated  
**When** I attempt to update my profile information  
**Then** the update is blocked  
**And** I am informed that inactive accounts cannot be modified
```

## Quality Requirements

- **Natural readability**: All names and scenarios flow naturally in English
- **Consistent structure**: Every scenario uses Given-When-Then format
- **Business-focused**: Emphasizes user value and business outcomes
- **Comprehensive coverage**: Every YAML path represented in scenarios
- **Clear causality**: Given sets context, When triggers action, Then states outcome
- **Actionable**: Scenarios can guide acceptance testing and validation

Generate the complete scenarios.md file with naturally flowing English in Given-When-Then format that business stakeholders can easily read, understand, and use for acceptance criteria and testing guidance.