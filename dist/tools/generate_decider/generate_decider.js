import { sampleLlm } from "../../utils/utils";
import { z } from 'zod';
export const addGenerateDecider = (mcp) => (session) => {
    mcp.addTool({
        name: "generate_decider",
        description: "Generates decider implementation through iterative construction and validation",
        parameters: z.object({
            lifecycle_yaml: z.string().describe(`The lifecycle.yaml content')`),
            assertions_yaml: z.string().describe(`The assertions.yaml content (optional)`),
            types_ts: z.string().describe(`The types.ts content`),
            validation_level: z.union([
                z.literal('basic'),
                z.literal('comprehensive'),
                z.literal('production'),
            ]).describe(`Code quality and validation level`),
        }),
        execute: async (args) => {
            const { lifecycle_yaml, assertions_yaml, types_ts, validation_level = "comprehensive" } = args;
            const systemPrompt = `You are a senior TypeScript developer expert in functional programming and business logic implementation, using the ubi-decider library to implement the decider pattern as in this example: ${example}`;
            const sample = sampleLlm(session)(systemPrompt);
            try {
                // Step 1: Analyze implementation requirements
                const requirements = await sampleRequirements(sample)(lifecycle_yaml)(assertions_yaml);
                // Step 2: Generate preconditions implementation
                const preconditions = await samplePreconitions(sample)(requirements)(lifecycle_yaml)(types_ts)(assertions_yaml);
                // Step 3: Generate branches implementation
                const branches = await sampleBranches(sample)(requirements)(lifecycle_yaml)(types_ts)(assertions_yaml);
                // Step 4: Generate evolutions implementation
                const evolution = await sampleEvolutions(sample)(requirements)(lifecycle_yaml)(types_ts);
                // Step 5: Generate helper functions
                const helpers = await sampleHelpers(sample)(requirements)(assertions_yaml)(types_ts);
                // Step 6: Assemble final decider
                const decider = await sampleFinalDecider(sample)(preconditions)(evolution)(branches)(helpers)(validation_level)(types_ts);
                return {
                    content: [
                        {
                            type: "text",
                            text: `# Generated Decider Implementation

                                                    ## Implementation Analysis
                                                    ${requirements}

                                                    ## Final Decider.ts
                                                    \`\`\`typescript
                                                    ${decider}
                                                    \`\`\`

                                                    ---
                                                    *Generated through iterative implementation construction and validation.*`
                        }
                    ]
                };
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error generating decider: ${error instanceof Error ? error.message : 'Unknown error'}`
                        }
                    ],
                    isError: true
                };
            }
        }
    });
};
const sampleRequirements = (sample) => (lifecycle_yaml) => async (assertions_yaml) => {
    const userPrompt = `Analyze implementation requirements for the decider:
      
      Lifecycle:
      \`\`\`yaml
      ${lifecycle_yaml}
      \`\`\`
      
      Assertions:
      \`\`\`yaml
      ${assertions_yaml}
      \`\`\`
      
      Extract:
      - All preconditions and their logic implementation needs
      - All branching conditions and their implementation
      - All evolution patterns for state changes
      - Helper functions needed for validation
      - Type casting and safety requirements
      
      Provide a structured plan for implementation.`;
    return await sample(userPrompt);
};
const samplePreconitions = (sample) => (implementationAnalysis) => (lifecycle_yaml) => (types_ts) => async (assertions_yaml) => {
    const userPrompt = `Generate the preconditions implementation:
      
      Implementation Plan: ${implementationAnalysis}
      Lifecycle Reference: ${lifecycle_yaml}
      Assertions Reference: ${assertions_yaml}
      Types Reference: ${types_ts}

      
      Create the preconditions object with:
      - Proper structure: { 'command-type': [precondition array] }
      - Format: ['Description', (dm) => boolean, 'failure_code']
      - Convert assertion expressions to executable TypeScript
      - Include proper type guards and error handling
      - Add descriptive comments
      
      Use the exact assertion expressions as the basis for implementation.`;
    return await sample(userPrompt);
};
const sampleBranches = (sample) => (implementationAnalysis) => (lifecycle_yaml) => (types_ts) => async (assertions_yaml) => {
    const userPrompt = `Generate the branches implementation:
      
      Implementation Plan: ${implementationAnalysis}
      Lifecycle Reference: ${lifecycle_yaml}
      Assertions Reference: ${assertions_yaml}
      Types Reference: ${types_ts}

      Create the branches object with:
      - Structure: { 'command-type': [branch array] }
      - Format: ['Condition', (dm) => boolean, (dm) => Event]
      - Proper event generation matching types
      - Type-safe command casting
      - Event data extraction from commands
      
      Ensure events match the type definitions and lifecycle specifications.`;
    return await sample(userPrompt);
};
const sampleEvolutions = (sample) => (implementationAnalysis) => (lifecycle_yaml) => async (types_ts) => {
    const userPrompt = `Generate the evolutions implementation:
      
      Implementation Plan: ${implementationAnalysis}
      Lifecycle Outcomes: ${lifecycle_yaml}
      State Types: ${types_ts}
      
      Create the evolutions object with:
      - Structure: { 'event-type': (em) => NewState }
      - Proper state transitions based on outcome assertions
      - Timestamp handling and generated field management
      - Type-safe state evolution
      - State preservation for unchanged fields
      
      Ensure evolutions satisfy all outcome assertions from the lifecycle.`;
    return await sample(userPrompt);
};
const sampleHelpers = (sample) => (implementationAnalysis) => (assertions_yaml) => async (types_ts) => {
    const userPrompt = `Generate helper functions needed by the implementation:
      
      Implementation Analysis: ${implementationAnalysis}
      Assertions: ${assertions_yaml}
      Types: ${types_ts}
      
      Generate helper functions for:
      - Validation logic (email, password, etc.)
      - Business rule checking
      - Data transformation
      - ID generation and hashing
      - Any utility functions referenced in assertions
      
      Create helper functions with proper TypeScript typing.`;
    return await sample(userPrompt);
};
const sampleFinalDecider = (sample) => (preconditionsImpl) => (evolutionsImpl) => (branchesImpl) => (helperFunctions) => (validation_level) => async (types_ts) => {
    const userPrompt = `Assemble the complete decider.ts file:
      
      Preconditions: ${preconditionsImpl}
      Branches: ${branchesImpl}
      Evolutions: ${evolutionsImpl}
      Helpers: ${helperFunctions}
      Types Reference: ${types_ts}
      
      Create the final decider.ts file with:
      - Proper imports from types and framework
      - All implementation sections
      - Helper functions
      - Decider export with proper typing
      - Clean, readable code structure
      
      Ensure ${validation_level} quality standards and proper TypeScript compliance.`;
    return await sample(userPrompt);
};
const example = `
Example for: 

export type TBookLoanDecider = TDecider<
  BookLoanCmd,
  BookLoanEvt,
  BookLoan,
  LoanFailures
>;

\`\`\`ts
import { TDecider, Decider } from "../../../decider";



export const preconditions: TBookLoanDecider['preconditions'] = {
    'request-loan': [
        ['Is a new loan', (dm) => dm.state === undefined, 'loan_already_exists'],
        ['The book is available to loan', (dm) => dm.cmd.type === 'request-loan' && dm.cmd.data.bookIsAvailable, 'book_not_available'],
        ['User is elegible for loans', (dm) => dm.cmd.type === 'request-loan' && dm.cmd.data.userIsEligible, 'user_not_eligible'],
    ],
    'start-loan': [
        ['Loan was requested', (dm) => dm.state?.status === 'requested', 'loan_not_in_requested_state'],
        ['Book is still available for loan', (dm) => dm.cmd.type === 'start-loan' && dm.cmd.data.bookIsStillAvailable, 'book_not_available'],
        ['User does not exceed the load limits', (dm) => dm.cmd.type === 'start-loan' && dm.cmd.data.userBelowLoanLimit, 'user_exceeds_loan_limit'],
    ],
    'return-book': [
        ['Loan is in active or overdue status', (dm) => !!dm.state && ['active', 'overdue'].includes(dm.state.status), 'loan_not_returnable'],
    ],
    'mark-overdue': [
        ['Loan is active', (dm) => dm.state?.status === 'active', 'loan_not_active'],
        ['Due date has passed', (dm) => dm.cmd.type === 'mark-overdue' && !!dm.state && dm.cmd.data.today > dm.state?.dueDate, 'due_date_not_exceeded']
    ]
}


export const branches: TBookLoanDecider['branches'] = {
    'request-loan': [
        [
            'Always',
            (dm) => true,
            (dm) => {
                const cmd = dm.cmd as RequestLoanCmd
                return {
                    type: 'loan-requested',
                    data: {
                        loanId: cmd.data.loanId,
                        userId: cmd.data.userId,
                        bookId: cmd.data.bookId,
                        createdAt: +Date.now(),
                        dueDate: +Date.now() + 1000
                    }
                } satisfies LoanRequestedEvt
            },
        ], [
          'Is university student',
          (dm) => {
            const cmd = dm.cmd as RequestLoanCmd
            return cmd.data.isUniversityStudent && cmd.data.hasUniversityConvention
          },
          (dm) => {
            const cmd = dm.cmd as RequestLoanCmd
                return {
                    type: 'loan-requested-from-uni',
                    data: {
                        loanId: cmd.data.loanId,
                        userId: cmd.data.userId,
                        bookId: cmd.data.bookId,
                        createdAt: +Date.now(),
                        dueDate: +Date.now() + 1000
                    }
                } satisfies LoanRequestedFromUniEvt
          }
        ]
    ],
    'start-loan': [
        [
            'Always',
            (dm) => true,
            (dm) => {
                const cmd = dm.cmd as ApproveLoanCmd
                return {
                    type: 'loan-approved',
                    data: {
                        loanId: cmd.data.loanId,
                        loanedAt: +Date.now()
                    }
                } satisfies LoanApprovedEvt
            }
        ]
    ],
    'return-book': [
        [
            'Always',
            (dm) => true,
            (dm) => {
                const cmd = dm.cmd as ReturnLoanCmd
                return {
                    type: 'loan-returned',
                    data: {
                        loanId: cmd.data.loanId,
                        returnedAt: +Date.now()
                    }
                } satisfies LoanReturnedEvt
            }
        ],
        [
            'Loan was overdue', 
            (dm) => dm.state?.status === 'overdue',
            (dm) => {
                const cmd = dm.cmd as ReturnLoanCmd
                return {
                    type: 'loan-returned-overdue',
                    data: {
                        loanId: cmd.data.loanId,
                        returnedAt: +Date.now(),
                        dueDate: dm.state?.dueDate!
                    }
                } satisfies LoanReturnedOverdueEvt
            }
        ]
    ],
    'mark-overdue': [
        [
            'Always',
            (dm) => true,
            (dm) => {
                const cmd = dm.cmd as MarkLoanOverdueCmd
                return {
                    type: 'loan-marked-overdue',
                    data: {
                        loanId: cmd.data.loanId
                    }
                } satisfies LoanMarkedOverdueEvt
            }
        ]
    ]
}

const evolutions: TBookLoanDecider['evolutions'] = {
    'loan-requested':
        (em) => {
            const e = em.evt as LoanRequestedEvt
            return {
                ...e.data,
                status: 'requested'

            } satisfies RequestedLoan
        }
    ,
    'loan-requested-from-uni': 
        (em) => {
          return em.state 
        } 
    ,
    'loan-approved':
        (em) => {
            const e = em.evt as LoanApprovedEvt
            return {
                ...em.state!,
                status: 'active',
                loanedAt: e.data.loanedAt
            } satisfies ActiveLoan
        }
    ,
    'loan-returned': 
        (em) => {
            const e = em.evt as LoanReturnedEvt
            const state = em.state as ActiveLoan
            return {
                ...state!,
                returnedAt: e.data.returnedAt,
                status: 'closed'
            } satisfies ClosedLoan
        }
    ,
    'loan-marked-overdue': 
        (em) => {
            const e = em.evt as LoanMarkedOverdueEvt
            const s = em.state as ActiveLoan
            return {
                ...s!,
                status: 'overdue'
            } satisfies OverdueLoan
        }
    ,
    'loan-returned-overdue': 
        (em) => {
            return em.state
        }
    
}

export const BookLoanDecider: Decider<TBookLoanDecider> = new Decider(
    preconditions,
    branches,
    evolutions
)


\`\`\`
`;
const lib = `
\`\`\`ts
//----------DECISION PROCESS------

/**
 * Basic message shape.
 * TODO: Make it extensible with metadata
 */
export type Message = {
  /** Command or event identifier */
  type: string;
  /** Arbitrary payload */
  data: any;
};

/**
 * Represents a failure event when a precondition is not met.
 * @template C  the command type
 * @template F  the failure reason literal type
 */
export type FailEvt<C, F extends string> = {
  type: "operation-failed";
  data: {
    /** Original command that failed */
    cmd: C;
    /** Literal reason why it failed */
    reason: F;
  };
};

/**
 * Combines the command (C) and the current state (A) into one model
 * for evaluation in a decision function.
 */
export type DecisionModel<C, A> = {
  /** The incoming command */
  cmd: C;
  /** The state against which the command is applied */
  state: A;
};

/**
 * Shape of the result when a decision succeeds.
 * @template E  the event type produced on success
 */
export type SuccessDecision<E> = {
  outcome: "success";
  /** One or more events triggered by the command */
  evts: E[];
};

/**
 * Shape of the result when a decision fails its preconditions.
 * @template C  the command type
 * @template F  the failure reason literal type
 */
export type FailDecision<C, F extends string> = {
  outcome: "fail";
  /** List of failure events, one per violated precondition */
  evts: FailEvt<C, F>[];
};

/**
 * Union of both possible decision outcomes.
 * @template C  the command type
 * @template E  the event type
 * @template F  the failure reason literal type
 */
export type DecisionOutcome<C, E, F extends string> =
  | SuccessDecision<E>
  | FailDecision<C, F>;

/**
 * A function that asserts whether a given DecisionModel is valid.
 * Returns true if the precondition holds.
 */
export type DmAssertionFn<C, A> = (dm: DecisionModel<C, A>) => boolean;

/**
 * A single precondition:  
 * [ human-readable description, assertion function, failure-code literal ]
 */
export type Precondition<C, A, F extends string> = [
  /** e.g. "user must be logged in" */
  string,
  /** assertion on the model */
  DmAssertionFn<C, A>,
  /** error code if assertion is false */
  F
];

/**
 * Map from each message type to its list of preconditions.
 */
export type Preconditions<C extends Message, A, F extends string> = 
  Record<C["type"], Precondition<C, A, F>[]>;

/**
 * Evaluates all preconditions for a DecisionModel:  
 * - returns a FailDecision if any fail  
 * - otherwise returns a simple success marker
 */
export type EvalPreconditionsFn<C extends Message, A, F extends string> = 
  (p: Preconditions<C, A, F>) =>
  (dm: DecisionModel<C, A>) =>
    | FailDecision<C, F>
    | { outcome: "success" };

/**
 * Function to generate a single event from a DecisionModel.
 */
type DmToEvtFn<C, E, A> = (dm: DecisionModel<C, A>) => E;

/**
 * A branching rule:  
 * [ description, guard assertion, event-generator function ]
 */
export type Branch<C, E, A> = [
  /** e.g. "if balance < 0" */
  string,
  /** guard assertion */
  DmAssertionFn<C, A>,
  /** event to produce if guard passes */
  DmToEvtFn<C, E, A>
];

/**
 * Map from each message type to its list of branches.
 */
export type Branches<C extends Message, E, A> = 
  Record<C["type"], Branch<C, E, A>[]>;

/**
 * Evaluates all branches for a DecisionModel and always returns
 * a SuccessDecision containing all produced events.
 */
export type EvalBranchesFn<C extends Message, E, A> = 
  (b: Branches<C, E, A>) =>
  (dm: DecisionModel<C, A>) =>
    SuccessDecision<E>;

/**
 * Composes preconditions + branches into a full decision function.
 * @returns a DecisionOutcome: either success+events or fail+failevts
 */
export type DecideFn<C extends Message, E, A, F extends string> = 
  (p: Preconditions<C, A, F>) =>
  (b: Branches<C, E, A>) =>
  (dm: DecisionModel<C, A>) =>
    DecisionOutcome<C, E, F>;


//----------EVOLVE PROCESS------

/**
 * Pairs an event with the current state for evolution.
 */
export type EvolutionModel<E, A> = {
  evt: E;
  state: A;
};

/**
 * Pure function that, given an event+state, returns a new state.
 */
export type EvolutionFn<E, A> = (em: EvolutionModel<E, A>) => A;

/**
 * Map from event.type to its evolution function.
 */
export type Evolutions<E extends Message, A> = 
  Record<E["type"], EvolutionFn<E, A>>;

/**
 * Evaluates a sequence of events against the initial state.
 */
export type EvalEvolutionsFn<E extends Message, A> = 
  (e: Evolutions<E, A>) =>
  (evts: E[]) =>
  (initialState: A) =>
    A;

/** Simplified alias: feed events to get final state. */
export type EvolveFn<E extends Message, A> = (evts: E[]) => A;


//----------RUN DECIDER------

/**
 * On failure, include the original DecisionModel and unchanged state.
 */
export type FailOutcome<C, A, F extends string> = {
  dm: DecisionModel<C, A>;
  outcome: "fail";
  evts: FailEvt<C, F>[];
};

/**
 * On success, include the DecisionModel and the new state after evolution.
 */
export type SuccessOutcome<C, E, A> = {
  dm: DecisionModel<C, A>;
  outcome: "success";
  evts: E[];
  state: A;
};

/**
 * Final result of running a command through decision + evolution.
 */
export type OutcomeModel<C, E, A, F extends string> =
  | SuccessOutcome<C, E, A>
  | FailOutcome<C, A, F>;

/**
 * Builds the full “run” function from its components.
 */
export type RunBuilderFn<C extends Message, E extends Message, A, F extends string> = 
  (d: DecideFn<C, E, A, F>) =>
  (e: EvalEvolutionsFn<E, A>) =>
  (p: Preconditions<C, A, F>) =>
  (b: Branches<C, E, A>) =>
  (e: Evolutions<E, A>) =>
  (dm: DecisionModel<C, A>) =>
    OutcomeModel<C, E, A, F>;

/**
 * The fully-built runner: supply preconds, branches, evolutions, then a model.
 */
export type RunBuiltFn<C extends Message, E extends Message, A, F extends string> = 
  (p: Preconditions<C, A, F>) =>
  (b: Branches<C, E, A>) =>
  (e: Evolutions<E, A>) =>
  (dm: DecisionModel<C, A>) =>
    OutcomeModel<C, E, A, F>;

/**
 * Simplest runner signature: feed it a DecisionModel, get back outcome.
 */
export type RunFn<C extends Message, E extends Message, A, F extends string> = 
  (dm: DecisionModel<C, A>) =>
    OutcomeModel<C, E, A, F>;


//----------DECIDER------

/** Default failure types every decider supports. */
export type DefaultFails = "cmd_not_found" | "invalid_initial_state";

/**
 * All pieces of a typed decider, for introspection or DI.
 */
export type TDecider<C extends Message, E extends Message, A, F extends string> = {
  cmds: C;
  evts: E;
  state: A;
  fails: F;
  preconditions: Preconditions<C, A | undefined, F | DefaultFails>;
  branches: Branches<C, E, A | undefined>;
  evolutions: Evolutions<E, A | undefined>;
  dm: DecisionModel<C, A | undefined>;
  om: OutcomeModel<C, E | FailEvt<C, F | DefaultFails>, A | undefined, F | DefaultFails>;
  success_om: SuccessOutcome<C, E, A | undefined>
  fail_om: FailOutcome<C, A | undefined, F | DefaultFails>
  evolve: EvolveFn<E, A | undefined>;
  run: RunFn<C, E | FailEvt<C, F | DefaultFails>, A | undefined, F | DefaultFails>;
};

/** A completely-generic decider, no type safety. */
export type AnyDecider = TDecider<any, any, any, any>;



import { 
    Message,
    FailEvt,
    EvalPreconditionsFn,
    EvalBranchesFn,
    DecisionModel,
    DecisionOutcome,
    Precondition,
    Preconditions,
    Branches,
    FailDecision,
    SuccessDecision,
    Branch,
    Evolutions,
    EvolutionFn,
    DecideFn,
    OutcomeModel,
    EvalEvolutionsFn,
    AnyDecider,
    DefaultFails,
    RunBuiltFn,
} from './types'

/**
 * Constructs a failure event indicating a command could not be applied.
 * @template C  Command type
 * @template F  Failure reason literal type
 * @param cmd  The original command that failed
 * @returns A function taking a failure reason and returning a FailEvt
 */
const newFailEvt =
  <C, F extends string>(cmd: C) =>
  (m: F): FailEvt<C, F> => {
    return {
      type: "operation-failed",
      data: {
        cmd,
        reason: m,
      },
    };
  };

/**
 * Evaluates a set of preconditions against a DecisionModel.
 * @template C Message type
 * @template A State type
 * @template F Failure reason literal type
 * @param p  Preconditions map keyed by command type
 * @returns A function that, given a DecisionModel, returns either a FailDecision or success marker
 */
const _evalPreconditions = <C extends Message, A, F extends string>
    (p: Preconditions<C, A, F>) =>
    (dm: DecisionModel<C, A>): FailDecision<C, F> | { outcome: 'success' } => {
        // Retrieve preconditions for this command type
        const preconditions: Precondition<C, A, F>[] = p[dm.cmd.type];
        // Collect failure events for any violated preconditions
        const evts: FailEvt<C, F>[] = preconditions.reduce(
          (acc: FailEvt<C, F>[], [desc, assertFn, reason]) => {
            if (!assertFn(dm)) {
              acc.push(newFailEvt<C, F>(dm.cmd)(reason));
            }
            return acc;
          },
          []
        );
        // If any failures, return a FailDecision
        if (evts.length) {
            return {
                outcome: 'fail',
                evts
            };
        }
        // No failures: return success marker
        return {
            outcome: 'success'
        };
    }

/**
 * Evaluates branching logic to produce domain events from a DecisionModel.
 * @template C Message type
 * @template E Event type produced
 * @template A State type
 * @param b  Branch definitions keyed by command type
 * @returns A function that, given a DecisionModel, returns a SuccessDecision with events
 */
const _evalBranches = <C extends Message, E, A>
    (b: Branches<C, E, A>) =>
    (dm: DecisionModel<C, A>): SuccessDecision<E> => {
        const branches: Branch<C, E, A>[] = b[dm.cmd.type];
        if (!branches.length) {
            throw new Error(\`There must be at least one branch for cmd \`);
        }
        // Generate events for each branch whose guard passes
        const evts: E[] = branches.reduce((out: E[], [desc, guardFn, toEvt]) => {
            if(guardFn(dm)){
                return [...out, toEvt(dm)]
            }
            return out
            // return guardFn(dm) ? [...out, toEvt(dm)] : out;
        }, []);
        if (!evts.length) {
            throw new Error(\`There must be at least one event returned for cmd \`);
        }
        return {
            outcome: 'success',
            evts
        };
    }

/**
 * Composes precondition and branch evaluation into a full decision function.
 * @template C Message type
 * @template E Event type
 * @template A State type
 * @template F Failure reason literal type
 * @param ep  Precondition evaluator
 * @param eb  Branch evaluator
 * @returns A DecideFn taking preconditions, branches, and a model to produce a DecisionOutcome
 */
const _decide = <C extends Message, E, A, F extends string>
    (ep: EvalPreconditionsFn<C, A, F>) =>
    (eb: EvalBranchesFn<C, E, A>) =>
    (p: Preconditions<C, A, F>) =>
    (b: Branches<C, E, A>) =>
    (dm: DecisionModel<C, A>): DecisionOutcome<C, E, F> => {
        const preconRes = ep(p)(dm);
        if (preconRes.outcome === 'fail') {
            return preconRes;
        }
        return eb(b)(dm);
    }

/**
 * Factory to create a fully-typed DecideFn via partial application.
 */
const decide = <C extends Message, E, A, F extends string>(): DecideFn<C, E, A, F> =>
    _decide<C, E, A, F>(_evalPreconditions<C, A, F>)(_evalBranches<C, E, A>);

/**
 * Applies a sequence of events to an initial state, returning the final state.
 * @template E Event type
 * @template A State type
 * @param e  Map of evolution functions keyed by event type
 * @returns A function that, given events and an initial state, reduces to the final state
 */
const evalEvolutions = <E extends Message, A>
    (e: Evolutions<E, A>) =>
    (events: E[]) =>
    (initialState: A): A => {
        const newState = events.reduce((state: A, evt: E) => {
            const fn: EvolutionFn<E, A> = e[evt.type];
            const evolved = fn({ evt, state })
            return evolved;
        }, initialState);
        return newState
    };

/**
 * Builds the full run function from decide + evolve.
 * @template C Message type (cmd)
 * @template E Message type (evt)
 * @template A State type
 * @template F Failure reason literal type
 */
const _runBuilder = <C extends Message, E extends Message, A, F extends string>
    (decideFn: DecideFn<C, E, A, F>) =>
    (evolveFn: EvalEvolutionsFn<E, A>) =>
    (p: Preconditions<C, A, F>) =>
    (b: Branches<C, E, A>) =>
    (e: Evolutions<E, A>) =>
    (dm: DecisionModel<C, A>): OutcomeModel<C, E, A, F> => {
        const decisionOutcome = decideFn(p)(b)(dm);
        if (decisionOutcome.outcome === 'fail') {
            return { ...decisionOutcome, dm };
        }
        const newState = evolveFn(e)(decisionOutcome.evts)(dm.state);
        return { ...decisionOutcome, dm, state: newState };
    };

/**
 * Factory for a fully-typed RunBuiltFn via partial application.
 */
const _run = <C extends Message, E extends Message, A, F extends string>(): RunBuiltFn<C, E, A, F> =>
    _runBuilder(decide<C, E, A, F>())(evalEvolutions<E, A>);

/**
 * Main Decider class ties together preconditions, branches, and evolutions
 * into a single object with \`.run\` and \`.evolve\` methods.
 */
export class Decider<D extends AnyDecider> {
    public run: D['run'];
    public evolve: D['evolve'];

    constructor(
        private p: D['preconditions'],
        private b: D['branches'],
        private e: D['evolutions']
    ) {
        // Instantiate the run function with all type parameters and inputs
        this.run = _run<D['cmds'], D['evts'], D['state'] | undefined, D['fails'] | DefaultFails>()(
            this.p
        )(this.b)(this.e);
        // Instantiate the evolve function
        this.evolve = evalEvolutions<D['evts'], D['state'] | undefined>(this.e);
    }
}

    
\`\`\`

`;
