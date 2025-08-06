import { buildPromptMessages } from "../utils/utils";
import { ubiTypes } from "../utils/ubi/ubi-types";
import { ubiFunctions } from "../utils/ubi/ubi-functions";
export const testOperationPrompt = async (args) => {
    const { domain = '', lifecycle_yaml = '' } = args;
    const systemPrompt = `
  ##Preparation

  First of all make sure you know which aggregate and which operation we're working on. If not sure, ask the user. This prompt only works with one operation at the time.
  Once you know the aggregate, there should be an associated:

  - lifecycle.yaml file 
  - aggregatename.types.ts
  - aggregatename.events.ts
  - aggregatename.decider.ts
  - aggregatename.evolutions.ts
  
  Red them.

  For the operation at hand, there should be a:

  - operationname/decision.ts file.

  Read it.
  
  Analyse the provided lifecycle.yaml and extract the operation we are working on.
  

  ##Extract Scenarios

  From the yaml file, you need to infer the complete set of successful scenarios and failure scenarios.

  Remember that failure scenarios will emit an array of operation-failed events detailing the preconditions that failed in the reason field.

  Group the scenarios by success or failure, as this example:

  \`\`\`md
## User Stories

**UC-01: Create User Account**
As a system administrator, I want to create user accounts so that new users can access the platform.

**Success Scenarios:**

**Name: Successful User Creation**
**Code: <unique scenario code>**
- Given: I am authenticated as an administrator
- And: The email address is not already in use
- And: The user data is complete and valid
- When: I submit a create-user command
- Then: A user-created event is emitted
- And: The user state is active
- And: The user ID is generated
- And: The password is securely hashed

**Failure Scenarios:**

**Name: Successful User Creation**
**Code: <unique scenario code>**
**Scenario: Duplicate Email**
- Given: I am authenticated as an administrator  
- When: I submit a create-user command with an existing email
- Then: The operation fails with "email_not_available"
\`\`\`

Write the scenarios in a operationname/scenarios.md file.

  ##Jest Test Suite

Your task is to write a comprehensive Jest test suite for all the scenario you extracted. 

Group the scenarios by success or failure. Include in the description the name and the code of the scenario.

You can use the .run method of the aggregate decider to execute the decider with the command and a state object and get the result to test.

Make sure to make detailed assertions on resulting events and their properties, including details of the fail events, and state status and its properties.

Remember that we used the ubi library for the implementation:

    - ubi types: ${ubiTypes}
    - ubi functions: ${ubiFunctions}

Additionally, you can make your own helper functions to help you build thorough test suite for this and other operations. Here is an example of helper file:

\`\`\`ts

import { notificationDecider, NotificationCmd, NotificationFailures } from './notification.decider'
import { Notification, PendingNotification, AttemptedNotification, FailedNotification, DeliveredNotification, AbandonedNotification, ManuallyDeliveredNotification } from './notification.domain'
import { FailEvt, DecisionModel, OutcomeModel } from '../ubi-decider/types'
import { NotificationEvents } from './notification.events'

export const createDM = <C extends NotificationCmd>(
  cmd: C,
  state?: Notification
): DecisionModel<C, Notification | undefined> => ({ cmd, state })

export const runCommand = <C extends NotificationCmd>(
  cmd: C,
  state?: Notification
) => notificationDecider.run(createDM(cmd, state))

export const expectFailureOutcome = <C extends NotificationCmd>(
  outcome: OutcomeModel<C, NotificationEvents | FailEvt<NotificationFailures>, Notification | undefined, NotificationFailures>,
  expectedReasons: NotificationFailures[]
) => {
  expect(outcome.outcome).toBe('fail')
  expect(outcome.evts.length).toBeGreaterThan(0)

  const reasons = outcome.evts.map(e => (e as FailEvt<NotificationFailures>).data.reason)
  expect(reasons).toEqual(expect.arrayContaining(expectedReasons))
  expect(reasons.length).toBe(expectedReasons.length)
}


export const expectSuccessOutcome = <C extends NotificationCmd>(
  outcome: OutcomeModel<C, NotificationEvents, Notification | undefined, NotificationFailures>,
  expectedEventTypes: NotificationEvents['type'][]
) => {
  expect(outcome.outcome).toBe('success')
  expect(outcome.evts.length).toBeGreaterThan(0)
  for (const evt of outcome.evts) {
    expect(expectedEventTypes).toContain(evt.type)
    expect(evt.data).toBeDefined()
  }
  if(outcome.outcome === 'success'){
      expect(outcome.state).toBeDefined()
  }
}

export const assertNotificationState = (
  state: Notification,
  expectations: Partial<Notification>
) => {
  for (const key of Object.keys(expectations)) {
    expect((state as any)[key]).toEqual((expectations as any)[key])
  }
}

/**
 * Asserts that the produced events match the expected types and optionally expected data keys.
 */
export const assertEvents = (
  events: NotificationEvents[],
  expectedEventTypes: string[],
  dataKeysCheck?: string[][]
) => {
  expect(events.length).toBe(expectedEventTypes.length)

  events.forEach((evt, idx) => {
    expect(evt.type).toBe(expectedEventTypes[idx])
    expect(evt.data).toBeDefined()

    if (dataKeysCheck && dataKeysCheck[idx]) {
      dataKeysCheck[idx].forEach(key => {
        expect(evt.data).toHaveProperty(key)
      })
    }
  })
}


export const createPendingNotification = (overrides?: Partial<PendingNotification>): PendingNotification => ({
  notificationId: 'n1',
  subscriptionId: 's1',
  eventType: 'order.created',
  eventData: { orderId: 'o1' },
  endpointUrl: 'https://webhook.site/test',
  secretToken: 'secret-token',
  retryPolicy: { maxRetries: 3 },
  retryCount: 0,
  status: 'pending',
  createdAt: new Date().toISOString(),
  scheduledFor: new Date().toISOString(),
  ...overrides
})

export const createAttemptedNotification = (overrides?: Partial<AttemptedNotification>): AttemptedNotification => ({
  notificationId: 'n1',
  subscriptionId: 's1',
  eventType: 'order.created',
  eventData: { orderId: 'o1' },
  endpointUrl: 'https://webhook.site/test',
  secretToken: 'secret-token',
  retryPolicy: { maxRetries: 3 },
  retryCount: 1,
  status: 'attempted',
  lastAttempt: {
    attemptNumber: 1,
    timestamp: new Date().toISOString(),
    result: 'failure',
    failureReason: 'timeout'
  },
  scheduledFor: new Date().toISOString(),
  ...overrides
})

export const createFailedNotification = (overrides?: Partial<FailedNotification>): FailedNotification => ({
  notificationId: 'n1',
  subscriptionId: 's1',
  eventType: 'order.created',
  eventData: { orderId: 'o1' },
  endpointUrl: 'https://webhook.site/test',
  secretToken: 'secret-token',
  retryPolicy: { maxRetries: 3 },
  retryCount: 3,
  status: 'failed',
  lastAttempt: {
    attemptNumber: 3,
    timestamp: new Date().toISOString(),
    result: 'failure',
    failureReason: 'network error'
  },
  finalFailureAt: new Date().toISOString(),
  ...overrides
})

export const createDeliveredNotification = (overrides?: Partial<DeliveredNotification>): DeliveredNotification => ({
  notificationId: 'n1',
  subscriptionId: 's1',
  eventType: 'order.created',
  eventData: { orderId: 'o1' },
  endpointUrl: 'https://webhook.site/test',
  secretToken: 'secret-token',
  retryPolicy: { maxRetries: 3 },
  retryCount: 1,
  status: 'delivered',
  lastAttempt: {
    attemptNumber: 1,
    timestamp: new Date().toISOString(),
    result: 'success',
    response: '200 OK'
  },
  deliveredAt: new Date().toISOString(),
  ...overrides
})

export const createAbandonedNotification = (overrides?: Partial<AbandonedNotification>): AbandonedNotification => ({
  notificationId: 'n1',
  subscriptionId: 's1',
  eventType: 'order.created',
  eventData: { orderId: 'o1' },
  endpointUrl: 'https://webhook.site/test',
  secretToken: 'secret-token',
  retryPolicy: { maxRetries: 3 },
  retryCount: 3,
  status: 'abandoned',
  abandonedAt: new Date().toISOString(),
  abandonedBy: 'admin-user',
  abandonmentReason: 'manual override',
  ...overrides
})

export const createManuallyDeliveredNotification = (overrides?: Partial<ManuallyDeliveredNotification>): ManuallyDeliveredNotification => ({
  notificationId: 'n1',
  subscriptionId: 's1',
  eventType: 'order.created',
  eventData: { orderId: 'o1' },
  endpointUrl: 'https://webhook.site/test',
  secretToken: 'secret-token',
  retryPolicy: { maxRetries: 3 },
  retryCount: 1,
  status: 'manually-delivered',
  deliveredAt: new Date().toISOString(),
  markedDeliveredBy: 'admin-user',
  ...overrides
})

\`\`\`

  
  Save your test suite as operationname/operationname.spec.ts
  `;
    const userPrompt = `Now that we have implemented the operation let's implement a comprehensive test suite to test it! 

`;
    return buildPromptMessages(systemPrompt)(userPrompt);
};
