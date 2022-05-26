--------------------------- MODULE WorkflowRepair ---------------------------
EXTENDS WorkflowDefinition
LOCAL INSTANCE Utilities

(**************************************************)
(*`^\textbf{ GIVEN the max workflow length of: }^'*)
(**************************************************)
CONSTANT MaxDepth
(*`^\begin{verbatim}
e.g. MaxDepth == 5
\end{verbatim}^'*)
(******************************************************)
(*`^\textbf{ such that it is a non-negative number }^'*)
(******************************************************)
ASSUME MaxDepth \in Nat

(***************************************************)
(*with the following workflow distance definitions *)
(***************************************************)

missingTaskTypes(W_new, W_old) == Cardinality(RAN(W_old) \ RAN(W_new))

additionalTaskTypes(W_new, W_old) == Cardinality(RAN(W_new) \ RAN(W_old))

missingTaskAmount(W_new, W_old) == BagCardinality(SeqToBag(W_old) (-) SeqToBag(W_new))

additionalTaskAmount(W_new, W_old) == BagCardinality(SeqToBag(W_new) (-) SeqToBag(W_old))

diffWorkflowLength(W_new, W_old) == Abs(Len(W_new) - Len(W_old))

diffTaskOrder(W_new, W_old) ==
    LET
        task_order_diffs == [ t \in (RAN(W_old) \cap RAN(W_new)) |->
            Abs( Sum(Indexes(W_old, t)) - Sum(Indexes(W_new, t)) )
        ]
        task_order_diffs_bag == RestrictRangeWithPredicate(task_order_diffs, LAMBDA n : n > 0)
    IN
        BagCardinality(task_order_diffs_bag)

(*******************************************************************)
(*and with the thus resulting set of all possible, valid workflows *)
(*******************************************************************)

ValidWorkflows == {
    W \in BoundedSeq(TaskNames, MaxDepth) :
        LET Validation == INSTANCE WorkflowValidation WITH
            Tasks <- Tasks,
            Connections <- Connections,
            Workflow <- W
        IN Validation!Errors = Validation!NoErrors
}

(******************************************************************************)
(*`^\textbf{ THEN the closest valid workflow is recommended as an alternative *)
(* to the given workflow, in case the given workflow is invalid }^'           *)
(******************************************************************************)
Recommendation ==
    LET Validation == INSTANCE WorkflowValidation WITH
        Connections <- Connections,
        Tasks <- Tasks,
        Workflow <- Workflow
    IN
        IF Validation!Errors = Validation!NoErrors
        THEN Workflow
        ELSE CHOOSE W_best \in ValidWorkflows :
          \A W_worse \in ValidWorkflows : W_best # W_worse =>
            \* 1. minimize deletion of tasks while going from old to new wf
            \/ missingTaskTypes(W_worse, Workflow)
                > missingTaskTypes(W_best, Workflow)
            \/
              /\ missingTaskTypes(W_worse, Workflow)
                = missingTaskTypes(W_best, Workflow)
              /\
                \* 2. minimize addition of tasks while going from old to new wf
                \/ additionalTaskTypes(W_worse, Workflow)
                    > additionalTaskTypes(W_best, Workflow)
                \/
                  /\ additionalTaskTypes(W_worse, Workflow)
                    = additionalTaskTypes(W_best, Workflow)
                  /\
                    \* 3. minimize reduction of task repetitions while going from old to new wf
                    \/ missingTaskAmount(W_worse, Workflow)
                        > missingTaskAmount(W_best, Workflow)
                    \/
                      /\ missingTaskAmount(W_worse, Workflow)
                        = missingTaskAmount(W_best, Workflow)
                      /\
                        \* 4. minimize increase of task repetitions while going from old to new wf
                        \/ additionalTaskAmount(W_worse, Workflow)
                            > additionalTaskAmount(W_best, Workflow)
                        \/
                          /\ additionalTaskAmount(W_worse, Workflow)
                            = additionalTaskAmount(W_best, Workflow)
                          /\
                            \* 5. minimize ordering difference of matching tasks in old and new wf
                            \/ diffTaskOrder(W_worse, Workflow)
                                > diffTaskOrder(W_best, Workflow)
                            \/
                              /\ diffTaskOrder(W_worse, Workflow)
                                = diffTaskOrder(W_best, Workflow)
                              /\
                                \* 6. minimize length difference between old and new wf
                                \/ diffWorkflowLength(W_worse, Workflow)
                                    > diffWorkflowLength(W_best, Workflow)
                                \/ diffWorkflowLength(W_worse, Workflow)
                                    = diffWorkflowLength(W_best, Workflow)
(*`^\begin{verbatim}
e.g. Recommendation == << "EVI", "IVI" >>
\end{verbatim}^'*)
(***************************************************************)
(*`^\textbf{ such that it adheres to the expected structure }^'*)
(***************************************************************)
ASSUME DOM(Recommendation) = 1..Len(Recommendation) \* a proper tuple
ASSUME \A t \in RAN(Recommendation) : t \in STRING
ASSUME \A t \in RAN(Recommendation) : \E task \in Tasks : task.name = t

=============================================================================

