------------------------ MODULE WorkflowRepairPretty ------------------------
EXTENDS WorkflowRepair

\* $W$ ... the sequence of workflow tasks to repair
W == Workflow \* e.g. $W = << "EVI", "IVI" >>$
\* $ValidWorkflows$ ... the set of all valid workflows that act as candidate recommendations
ValidWorkflows \* e.g. $ValidWorkflows = \{ << >>, << "EVI" >>, ... \}$
\* $W\_best$ ... the best alternative sequence of workflow tasks
W_best \* e.g. $W\_best = << "EVI", "XRAY", "IVI" >>$
\* $W\_worse$ ... any other worse alternative sequence of workflow tasks
W_worse \* e.g. $W\_worse = << "EVI" >>$

\A W_worse \in ValidWorkflows : W_best # W_worse =>
\* 1. minimize deletion of tasks while going from old to new wf
\/ missingTaskTypes(W_worse, W) > missingTaskTypes(W_best, W)
\/
 /\ missingTaskTypes(W_worse, W) = missingTaskTypes(W_best, W)
 /\
  \* 2. minimize addition of tasks while going from old to new wf
  \/ additionalTaskTypes(W_worse, W) > additionalTaskTypes(W_best, W)
  \/
   /\ additionalTaskTypes(W_worse, W) = additionalTaskTypes(W_best, W)
   /\
    \* 3. minimize reduction of task repetitions while going from old to new wf
    \/ missingTaskAmount(W_worse, W) > missingTaskAmount(W_best, W)
    \/
     /\ missingTaskAmount(W_worse, W) = missingTaskAmount(W_best, W)
     /\
      \* 4. minimize increase of task repetitions while going from old to new wf
      \/ additionalTaskAmount(W_worse, W) > additionalTaskAmount(W_best, W)
      \/
       /\ additionalTaskAmount(W_worse, W) = additionalTaskAmount(W_best, W)
       /\
        \* 5. minimize ordering difference of matching tasks in old and new wf
        \/ diffTaskOrder(W_worse, W) > diffTaskOrder(W_best, W)
        \/
         /\ diffTaskOrder(W_worse, W) = diffTaskOrder(W_best, W)
         /\
          \* 6. minimize length difference between old and new wf
          \/ diffWorkflowLength(W_worse, W) > diffWorkflowLength(W_best, W)
          \/ diffWorkflowLength(W_worse, W) = diffWorkflowLength(W_best, W)

=============================================================================

