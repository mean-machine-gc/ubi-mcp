export const ubiTypes = `
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
export type FailEvt<F extends string> = {
  type: "operation-failed";
  data: {
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
export type FailDecision<F extends string> = {
  outcome: "fail";
  /** List of failure events, one per violated precondition */
  evts: FailEvt<F>[];
};

/**
 * Union of both possible decision outcomes.
 * @template C  the command type
 * @template E  the event type
 * @template F  the failure reason literal type
 */
export type DecisionOutcome<C, E, F extends string> =
  | SuccessDecision<E>
  | FailDecision<F>;

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
    | FailDecision<F>
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
  evts: FailEvt<F>[];
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
  om: OutcomeModel<C, E | FailEvt<F | DefaultFails>, A | undefined, F | DefaultFails>;
  success_om: SuccessOutcome<C, E, A | undefined>
  fail_om: FailOutcome<C, A | undefined, F | DefaultFails>
  evolve: EvolveFn<E, A | undefined>;
  run: RunFn<C, E | FailEvt<F | DefaultFails>, A | undefined, F | DefaultFails>;
};

/** A completely-generic decider, no type safety. */
export type AnyDecider = TDecider<any, any, any, any>;


\`\`\`
`;
