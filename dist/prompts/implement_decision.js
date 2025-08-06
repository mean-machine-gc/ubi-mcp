import { buildPromptMessages } from "../utils/utils";
import { ubiTypes } from "../utils/ubi/ubi-types";
import { ubiFunctions } from "../utils/ubi/ubi-functions";
export const implementDecisionPrompt = async (args) => {
    const { domain = '', types = "", lifecycle_yaml = "", events = '' } = args;
    const systemPrompt = `
  First of all make sure you know which aggregate and which operation we're working on. If not sure, ask the user. This prompt only works with one operation at the time.
  Once you know the aggregate, there should be an associated:
  Once you know the aggregate, there should be an associated 

  - lifecycle.yaml file 
  - aggregatename.types.ts
  - aggregatename.events.ts
  - aggregatename.evolutions.ts
  
  Red them. Make sure we are working with an operation listed in the yaml, if not you need to abort, it is not possible to use this prompt if the operation is not valid.

  Your task is to implement the business logic for preconditions and branches for the aggregate. Together, they represent the decision step. Together with the evolve step, they complete the decider pattern implementation for the aggregagate.

  Looking at the yaml file you can see there are three types of business logic constrains:

  - Guards: rules that must be true to execute the operation. We don't need to worry about these ones. If they didn't pass, then the decider will be skipped.
  - Preconditions: rules that must be passed to produce a success event. If these rules are not passed, we will emit by default an array of ubi library FailEvt with the reason set to the preconditions failure.
  - Branching logic: if the preconditions pass, then there might be multiple events possible as success outcome. For each event we will evaluate the brnching logic condition, and if the condition passes, we will add the event to the list of emitted events for the evolve step.

  The implementation if based on the ubi library:

  - ubi types: ${ubiTypes}
  - ubi functions: ${ubiFunctions}

  The library is installed so you can import those from 'ubi' as per needed.

  First of all you need to create a DUMMY command for the operation, and a dummy failures type.
  
  This is !IMPORTANT because you will not know what data structure you need until you have done with the preconditions and branches. So you must set up initial dummies as follows:


  \`\`\`ts
    ./operation-name/decision.ts
    export type CommandNameCmd = {
        type: 'command-name' //same as operation name, in kebab case
        data: any //set this to any for the moment, you will come back here after 
    }

    export const OperationNameFailures = '' //failures literals union type
    \`\`\`


    Now examine the lifecycle.yaml file and focus on all the preconditions for the operation. The main task is to figure out the right assertions to validate them.
    Evaluating preconditions takes as input a DomainModel (dm = {cmd, state}) and returns a boolean
    The trick is to reason on the properties of the command needed for the evaluation. Because the decider only implements pure function logic, evaluation that are likely to require an async external call will be already evaluated and provided to us as a boolean property in the command data.
    Other evaluations might be very simple, such as checking the values of command data properties or state properties, or combining the two.
    Other evaluations might be slightly more complicated and might be cleaner to use a dedicated helper function.

    Go back to the ./operation-name/decision.ts file and begin implementing all the preconditions, as in this example, trying to infer optimal command data structure for the evaluation of the preconditions:

    \`\`\`ts
    export const attemptDeliveryPreconditions: Precondition<AttemptDeliveryCmd, Notification | undefined, AttemptDeliveryFailures>[] = [
    [
        'Notification exists',
        (dm: DecisionModel<AttemptDeliveryCmd, Notification | undefined>) => dm.state === undefined,
        'notification_not_found'
    ],
    [
        'Notification is pending or attempted',
        (dm: DecisionModel<AttemptDeliveryCmd, Notification | undefined>) => !!dm.state && !['pending', 'attempted'].includes(dm.state.status),
        'notification_not_pending_or_attempted'
    ],
    [
        'Valid delivery result',
        (dm: DecisionModel<AttemptDeliveryCmd, Notification | undefined>) => !['success', 'failure'].includes(dm.cmd.data.deliveryResult),
        'invalid_delivery_result'
    ]
]
    \`\`\`

    When done, you must add the failure strings to the list of failures union type.
    
    When done, you can move to evaluating the branching logic. Also branching logic are evaluated with a function that takes a DomainModel and returns a boolean. Again, try to infer the optimal data structure of the command for the evaluation of branching logic.
    You can implement it as in this example:

    \`\`\`ts
    export const attemptDeliveryBranches: Branch<AttemptDeliveryCmd, NotificationEvents, Notification | undefined>[] = [
    [
        'Delivery succeeded',
        (dm: DecisionModel<AttemptDeliveryCmd, Notification | undefined>) => dm.cmd.data.deliveryResult === 'success',
        (dm: DecisionModel<AttemptDeliveryCmd, Notification | undefined>) => ({
            type: 'notification-delivered',
            data: {
                notificationId: dm.cmd.data.notificationId,
                deliveredAt: dm.cmd.data.deliveryAttempt.timestamp,
                deliveryAttempt: dm.cmd.data.deliveryAttempt
            }
        })
    ],
    [
        'Delivery failed but retries remaining',
        (dm: DecisionModel<AttemptDeliveryCmd, Notification | undefined>) =>
            dm.cmd.data.deliveryResult === 'failure' && dm.cmd.data.retriesRemaining,
        (dm: DecisionModel<AttemptDeliveryCmd, Notification | undefined>) => ({
            type: 'notification-delivery-attempted',
            data: {
                notificationId: dm.cmd.data.notificationId,
                deliveryAttempt: dm.cmd.data.deliveryAttempt,
                scheduledFor: dm.cmd.data.nextRetryScheduledAt!
            }
        })
    ],
    [
        'Delivery failed and retries exhausted',
        (dm: DecisionModel<AttemptDeliveryCmd, Notification | undefined>) =>
            dm.cmd.data.deliveryResult === 'failure' && dm.cmd.data.retriesExhausted,
        (dm: DecisionModel<AttemptDeliveryCmd, Notification | undefined>) => ({
            type: 'notification-delivery-failed',
            data: {
                notificationId: dm.cmd.data.notificationId,
                finalFailureAt: dm.cmd.data.deliveryAttempt.timestamp,
                deliveryAttempt: dm.cmd.data.deliveryAttempt
            }
        })
    ]
]
    \`\`\`

    Be sure to apply type casting and type narrowing techniques as per needed.

    When done, you can now finalise the command type structure, including all the properties needed to evaluate preconditions and branching logic. Similar to events, also commands need to carry only necessary information and nothing more. 
    
    When done, save the ./operation-name/decision.ts.

    When done, import the preconditions and branches in to the aggregatename.decider.ts file as follows:

    \`\`\`ts
    //aggregate-name/decider.ts
    export type AggregateNameCmd = //union types of all the aggregate commands, create one if not present
        CommandName1Cmd |
        CommandName2Cmd //add the new command here

    export type AggregateNameFailures = //union types of all the aggregate failures, create one if not present
        Operation1Failures |
        Operation2Failures //add the new failure type here

   

    export type TAggregateNameDecider = TDecider<
        AggregateNameCmd, //add this if not present
        AggregateNameEvents, //events union from aggregatename.events.ts
        AggregateName, //actual domain model union type provided
        AggregateNameFailures //add this if not present
    >

    //create this record if it doesnt exist
     export const preconditions: TAggregateNameDecider['preconditions'] = {
        'operation1-name': operation1Precondition as unknown as TAggregateNameDecider['preconditions']['operation1-name'],
        //add your new precondition in this record
    }

    //create this record if it doesnt exist
    export const branches: TNotificationDecider['branches'] = {
        'operation1-name': operation1Branches as unknown as TNotificationDecider['branches']['operation1-name'],
        //add your new branches in this record
    }

    //create this decider if it doesnt exist
    export const aggregateNameDecider = new Decider(preconditions, branches, evolutions)
    \`\`\`




  `;
    const userPrompt = `Now that we have implemented the types and events for ${domain} let's implement the decision for one operation

`;
    return buildPromptMessages(systemPrompt)(userPrompt);
};
const evolutionExample = `
\`\`\`ts
export const evolutions: TNotificationDecider['evolutions'] = {
    'notification-created': (em) => {
        const e = em.evt as NotificationCreated
        return {
            notificationId: e.data.notificationId,
            subscriptionId: e.data.subscriptionId,
            eventType: e.data.eventType,
            eventData: e.data.eventData,
            endpointUrl: e.data.endpointUrl,
            secretToken: e.data.secretToken,
            retryPolicy: e.data.retryPolicy,
            retryCount: 0,
            status: 'pending',
            createdAt: e.data.createdAt,
            scheduledFor: e.data.scheduledFor
        } satisfies PendingNotification
    },

    'notification-delivered': (em) => {
        const e = em.evt as NotificationDelivered
        const s = em.state as PendingNotification | AttemptedNotification
        return {
            ...s,
            status: 'delivered',
            deliveredAt: e.data.deliveredAt,
            lastAttempt: e.data.deliveryAttempt
        } satisfies DeliveredNotification
    },

    'notification-delivery-attempted': (em) => {
        const e = em.evt as NotificationDeliveryAttempted
        const s = em.state as PendingNotification | AttemptedNotification
        return {
            ...s,
            status: 'attempted',
            lastAttempt: e.data.deliveryAttempt,
            scheduledFor: e.data.scheduledFor
        } satisfies AttemptedNotification
    },

    'notification-delivery-failed': (em) => {
        const e = em.evt as NotificationDeliveryFailed
        const s = em.state as PendingNotification | AttemptedNotification
        return {
            ...s,
            status: 'failed',
            finalFailureAt: e.data.finalFailureAt,
            lastAttempt: e.data.deliveryAttempt
        } satisfies FailedNotification
    },

    'notification-reset-for-retry': (em) => {
        const e = em.evt as NotificationResetForRetry
        const s = em.state as FailedNotification | AbandonedNotification
        return {
            ...s,
            status: 'pending',
            retryCount: 0,
            scheduledFor: e.data.scheduledFor,
            createdAt: e.data.resetAt // Optional: you might want to keep original createdAt; adjust as per business rules
        } satisfies PendingNotification
    },

    'notification-abandoned': (em) => {
        const e = em.evt as NotificationAbandoned
        const s = em.state as PendingNotification | AttemptedNotification | FailedNotification
        return {
            ...s,
            status: 'abandoned',
            abandonedAt: e.data.abandonedAt,
            abandonedBy: e.data.abandonedBy,
            abandonmentReason: e.data.abandonmentReason
        } satisfies AbandonedNotification
    },

    'notification-marked-delivered': (em) => {
        const e = em.evt as NotificationMarkedDelivered
        const s = em.state as PendingNotification | AttemptedNotification | FailedNotification
        return {
            ...s,
            status: 'manually-delivered',
            deliveredAt: e.data.deliveredAt,
            markedDeliveredBy: e.data.markedDeliveredBy
        } satisfies ManuallyDeliveredNotification
    }
}

export const testExports = {
    evolve: evalEvolutions<NotificationEvents, Notification | undefined>(evolutions)
}
\`\`\`
`;
// ## Available Tools During Design Process
// You have access to intelligent sampling-based tools that can assist during the conversation:
// ### Foundation & Analysis Tools
// - **analyze_domain_patterns**: Analyzes industry patterns and best practices for the domain through iterative sampling
// - **build_operation_incrementally**: Builds complete operation specifications through progressive analysis
// - **enhance_business_rules**: Enhances existing rules through multi-perspective analysis (security, edge cases, compliance)
// ### When to Use These Tools
// - **At the start**: Use \`analyze_domain_patterns\` when the user mentions a domain to provide intelligent foundation
// - **For each operation**: Use \`build_operation_incrementally\` to help design complex operations step-by-step
// - **For refinement**: Use \`enhance_business_rules\` when reviewing or improving the lifecycle specification
// ### Generation Tools (Available After Design)
// **implement_decider**: implement the decider up to the evolution step, with tests!
// - **generate_assertions**: Creates assertions.yaml with implementation specifications
// - **generate_types**: Creates types.ts with TypeScript type definitions  
// - **generate_decider**: Creates decider.ts with executable business logic
// - **generate_tests**: Creates comprehensive Jest test suites
// - **validate_drift**: Analyzes consistency across all specification files
