------------------------- MODULE WorkflowValidation -------------------------
EXTENDS WorkflowDefinition
LOCAL INSTANCE Utilities

(************************************************************)
(*`^\textbf{ THEN an error is returned for unknown tasks }^'*)
(************************************************************)
ErrorUnknownTasks ==
    LET
        KnownTaskConstraint(t) ==
            \E task \in Tasks : task.name = t
    IN
        { t \in RAN(Workflow) : ~KnownTaskConstraint(t) }
(***************************************************************)
(*`^\textbf{ such that it adheres to the expected structure }^'*)
(***************************************************************)
ASSUME IsFiniteSet(ErrorUnknownTasks)
ASSUME \A t \in ErrorUnknownTasks : t \in STRING

(**********************************************************************************)
(*`^\textbf{ THEN an error is returned for non-repeatable tasks being repeated }^'*)
(**********************************************************************************)
ErrorNonRepeatableTasks ==
    LET
        RepeatabilityConstraint(t) ==
            /\ Contains(Workflow, t)
            /\ ~Task(t).repeatable
            => Count(Workflow, t) <= 1
    IN
        { t \in TaskNames : ~RepeatabilityConstraint(t) }

(***************************************************************)
(*`^\textbf{ such that it adheres to the expected structure }^'*)
(***************************************************************)
ASSUME IsFiniteSet(ErrorNonRepeatableTasks)
ASSUME \A t \in ErrorNonRepeatableTasks : t \in STRING

(***************************************************************************************************)
(*`^\textbf{ THEN an error is returned for destructive tasks coming before non-destructive ones }^'*)
(***************************************************************************************************)
ErrorDestructiveBeforeNonDestructive ==
    LET
        DestructiveOrderConstraint(d) ==
            \A n \in TaskNames :
                /\ d # n
                /\ Contains(Workflow, d)
                /\ Contains(Workflow, n)
                /\ Task(d).group = "destructive"
                /\ Task(n).group = "non-destructive"
                => FirstIndex(Workflow, d) > LastIndex(Workflow, n)
    IN
        { t \in TaskNames : ~DestructiveOrderConstraint(t) }
(***************************************************************)
(*`^\textbf{ such that it adheres to the expected structure }^'*)
(***************************************************************)
ASSUME IsFiniteSet(ErrorDestructiveBeforeNonDestructive)
ASSUME \A t \in ErrorDestructiveBeforeNonDestructive : t \in STRING

(***********************************************************************)
(*`^\textbf{ THEN an error is returned for partial-order violations }^'*)
(***********************************************************************)
ErrorPartialOrderViolations ==
    LET
        PartialOrderConstraint(s, d) ==
            /\ s#d /\ TransConRel[s,d]
            /\ Contains(Workflow, s) /\ Contains(Workflow, d)
            /\ ~Task(s).repeatable \/ ~Task(d).repeatable
            => LastIndex(Workflow, s) < FirstIndex(Workflow, d)
    IN
        UNION { ErrorConn(s, d, PartialOrderConstraint) : s,d \in TaskNames }

(***************************************************************)
(*`^\textbf{ such that it adheres to the expected structure }^'*)
(***************************************************************)
ASSUME IsFiniteSet(ErrorPartialOrderViolations)
ASSUME \A conn \in ErrorPartialOrderViolations :
        \A id \in DOM(conn) : id \in { "name", "srcName", "dstName"}
ASSUME \A conn \in ErrorPartialOrderViolations : conn.name \in
    {   "has_successor"
    ,   "has_predecessor"
    ,   "has_mandatory_predecessor"
    ,   "has_mandatory_successor"
    }
ASSUME \A conn \in ErrorPartialOrderViolations : conn.srcName \in STRING
ASSUME \A conn \in ErrorPartialOrderViolations : conn.dstName \in STRING

(*********************************************************************************)
(*`^\textbf{ THEN an error is returned for missing mandatory dependency tasks }^'*)
(*********************************************************************************)
ErrorMissingMandatoryDependencies ==
    LET
        MandatoryDependencyConstraint(s, d) ==
        /\
            /\ s#d /\ TransConRel[s,d]
            /\ RequiresRel[s,d] /\ Contains(Workflow, s)
            =>  /\ Contains(Workflow, d)
                /\ LastIndex(Workflow, s) < LastIndex(Workflow, d)
        /\
            /\ s#d /\ TransConRel[s,d]
            /\ RequiresRel[d,s] /\ Contains(Workflow, d)
            =>  /\ Contains(Workflow, s)
                /\ FirstIndex(Workflow, s) < FirstIndex(Workflow, d)
    IN
        UNION { ErrorConns(s, d, MandatoryDependencyConstraint) : s,d \in TaskNames }

(***************************************************************)
(*`^\textbf{ such that it adheres to the expected structure }^'*)
(***************************************************************)
ASSUME IsFiniteSet(ErrorMissingMandatoryDependencies)
ASSUME \A conn \in ErrorMissingMandatoryDependencies :
        \A id \in DOM(conn) : id \in { "name", "srcName", "dstName"}
ASSUME \A conn \in ErrorMissingMandatoryDependencies : conn.name \in
    {   "has_successor"
    ,   "has_predecessor"
    ,   "has_mandatory_predecessor"
    ,   "has_mandatory_successor"
    }
ASSUME \A conn \in ErrorMissingMandatoryDependencies : conn.srcName \in STRING
ASSUME \A conn \in ErrorMissingMandatoryDependencies : conn.dstName \in STRING

(***************************************************************************************)
(*`^\textbf{ THEN an error is returned for missing mandatory dependency repetitions }^'*)
(***************************************************************************************)
ErrorMissingMandatoryDependencyRepetitions ==
    LET
        MandatoryRepetitionConstraint(s, d) ==
        /\
            /\ s#d /\ TransConRel[s,d] /\ RequiresRel[s,d]
            /\ Contains(Workflow, s) /\ Contains(Workflow, d)
            =>  \A i,j \in Indexes(Workflow, s) :
                    i < j => \E k \in Indexes(Workflow, d) : i < k /\ k < j
        /\
            /\ s#d /\ TransConRel[s,d] /\ RequiresRel[d,s]
            /\ Contains(Workflow, s) /\ Contains(Workflow, d)
            =>  \A i,j \in Indexes(Workflow, d) :
                    i < j => \E k \in Indexes(Workflow, s) : i < k /\ k < j
    IN
        UNION { ErrorConns(s, d, MandatoryRepetitionConstraint) : s,d \in TaskNames }

(***************************************************************)
(*`^\textbf{ such that it adheres to the expected structure }^'*)
(***************************************************************)
ASSUME IsFiniteSet(ErrorMissingMandatoryDependencyRepetitions)
ASSUME \A conn \in ErrorMissingMandatoryDependencyRepetitions :
        \A id \in DOM(conn) : id \in { "name", "srcName", "dstName"}
ASSUME \A conn \in ErrorMissingMandatoryDependencyRepetitions : conn.name \in
    {   "has_successor"
    ,   "has_predecessor"
    ,   "has_mandatory_predecessor"
    ,   "has_mandatory_successor"
    }
ASSUME \A conn \in ErrorMissingMandatoryDependencyRepetitions : conn.srcName \in STRING
ASSUME \A conn \in ErrorMissingMandatoryDependencyRepetitions : conn.dstName \in STRING

(**************************************************************)
(*`^\textbf{ FINALLY a structure of all errors is returned }^'*)
(**************************************************************)
Errors == [
    ErrorUnknownTasks |-> ErrorUnknownTasks,
    ErrorNonRepeatableTasks |-> ErrorNonRepeatableTasks,
    ErrorDestructiveBeforeNonDestructive |-> ErrorDestructiveBeforeNonDestructive,
    ErrorPartialOrderViolations |-> ErrorPartialOrderViolations,
    ErrorMissingMandatoryDependencies |-> ErrorMissingMandatoryDependencies,
    ErrorMissingMandatoryDependencyRepetitions |-> ErrorMissingMandatoryDependencyRepetitions
]
(*`^\begin{verbatim}
e.g. Errors ==
[ ErrorUnknownTasks |-> {"IVI"}
, ErrorNonRepeatableTasks |-> {"EVI"}
, ErrorDestructiveBeforeNonDestructive |-> {"IVI"}
, ErrorPartialOrderViolations |->
    { [ name |-> "has_successor", srcName |-> "EVI", dstName |-> "IVI" ] }
, ErrorMissingMandatoryDependencies |->
    { [ name |-> "has_mandatory_predecessor", srcName |-> "IVI", dstName |-> "EVI" ] }
, ErrorMissingMandatoryDependencyRepetitions |->
    { [ name |-> "has_mandatory_predecessor", srcName |-> "IVI", dstName |-> "EVI" ] }
]
\end{verbatim}^'*)

(*****************************************************************)
(*`^\textbf{ WHILE the structure containing no errors matches }^'*)
(*****************************************************************)
NoErrors == [
    ErrorUnknownTasks |-> {},
    ErrorNonRepeatableTasks |-> {},
    ErrorDestructiveBeforeNonDestructive |-> {},
    ErrorPartialOrderViolations |-> {},
    ErrorMissingMandatoryDependencies |-> {},
    ErrorMissingMandatoryDependencyRepetitions |-> {}
]

=============================================================================

