---------------------- MODULE WorkflowValidationPretty ----------------------
EXTENDS WorkflowValidation

\* $T$ ... The set of all tasks T
T == TaskNames \* e.g. $T = \{ "EVI", "XRAY", "IVI" \}$
\* $t^*$ ... The predicate indicating the repeatability of a task t
t^* == Task(t).repeatable \* e.g. $"XRAY"^* = true$
\* $destr(t)$ ... The predicate indicating the destructiveness of a task t
destr(t) == Task(t).group = "destructive" \* e.g. $destr("IVI") = true$
\* $non\_destr(t)$ ... The predicate indicating the non-destructiveness of a task t
non_destr(t) == Task(t).group = "non-destructive" \* e.g. $non\_destr("EVI") = true$

\* $A \prec B$, $B \succ A$ ... The partial order relation between tasks
A \prec B == ConRel[A,B] \* e.g. $"EVI" \prec "XRAY"$
B \succ A == ConRel[A,B] \* e.g. $"IVI" \succ "XRAY"$
\* $A \preceq B$, $B \succeq A$ ... The reflexive transitive closure over the partial order relation
A \preceq B == TransConRel[A,B] \* e.g. $"EVI" \preceq "IVI"$
B \succeq A == TransConRel[A,B] \* e.g. $"IVI" \succeq "EVI"$
\* $A |- B$, $B -| A$ ... The relation describing whether one task requires another task
A |- B == RequiresRel[A,B] \* e.g. $"XRAY" |- "EVI"$
B -| A == RequiresRel[A,B] \* e.g. $"XRAY" -| "IVI"$

\* $W$ ... the sequence of workflow tasks W
W == Workflow \* e.g. $W = << "EVI", "IVI", "EVI" >>$
\* $T(W)$ ... The set of all workflow tasks T(W)
T(W) == RAN(W) \* e.g. $T(W) = \{ "EVI", "IVI" \}$
\* $W \#\# t$ ... The amount of occurrences of task t in the given workflow sequence
W ## t == Count(W, t) \* e.g. $W \#\# "EVI" = 2$
\* $W @@ t$ ... The set of all indexes of a task t in the given workflow sequence
W @@ t == Indexes(W, t) \* e.g. $W @@ "EVI" = \{ 1, 3 \}$
\* $W \string^\string^ t$ ... The first index of a task t in the given workflow sequence
W ^^ t == FirstIndex(W, t) \* e.g. $W \string^\string^ "IVI" = 2$
\* $W \$\$ t$ ... The last index of a task t in the given workflow sequence
W $$ t == LastIndex(W, t) \* e.g. $W \$\$ "EVI" = 3$


(*
 All tasks must be known
 *)
KnownTaskConstraint ==
    \A t_w \in T(W):   \E t \in T:  t_w = t

(*
 Non-repeatable tasks must not be repeated
 *)
RepeatabilityConstraint ==
    \A t \in T:   t \in T(W) /\ ~t^*  =>  W ## t <= 1

(*
 Destructive tasks must come after non-destructive ones
 *)
DestructiveOrderConstraint ==
    \A d,n \in T:
        d # n /\ d \in T(W) /\ n \in T(W) /\ destr(d) /\ non_destr(n)  =>  W ^^ d > W $$ n

(*
Task order must adhere to (transitive) partial order
*)
PartialOrderConstraint ==
    \A a,b \in T:
        a#b /\ a \preceq b /\ a \in T(W) /\ b \in T(W) /\ (~a^* \/ ~b^*)  =>  W $$ a < W ^^ b

(*
Required tasks must be done before / after dependent tasks
*)
MandatoryDependencyConstraint ==
    \A a,b \in T:
        /\ a#b /\ a \preceq b /\ a |- b /\ a \in T(W)  =>  b \in T(W) /\ W $$ a < W $$ b
        /\ a#b /\ a \preceq b /\ a -| b /\ b \in T(W)  =>  a \in T(W) /\ W ^^ a < W ^^ b

(*
Required tasks must be done in between dependent tasks, in case of repetition
*)
MandatoryRepetitionConstraint ==
    \A a,b \in T:
        /\
            /\ a#b /\ a \preceq b /\ a |- b /\ a \in T(W) /\ b \in T(W)
            =>  \A i,j \in (W @@ a):   i < j   =>   \E k \in (W @@ b):  i < k /\ k < j
        /\
            /\ a#b /\ a \preceq b /\ a -| b /\ a \in T(W) /\ b \in T(W)
            =>  \A i,j \in (W @@ b):   i < j   =>   \E k \in (W @@ a):  i < k /\ k < j

=============================================================================
