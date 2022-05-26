------------------------- MODULE WorkflowDefinition -------------------------
LOCAL INSTANCE Utilities

(****************************************)
(*`^\textbf{ GIVEN the set of tasks: }^'*)
(****************************************)
CONSTANT Tasks
(*`^\begin{verbatim}
e.g. Tasks ==
{   [ name |-> "EVI", repeatable |-> FALSE, group |-> "non-destructive" ]
,   [ name |-> "IVI", repeatable |-> FALSE, group |-> "non-destructive" ]
}
\end{verbatim}^'*)
(***************************************************************)
(*`^\textbf{ such that it adheres to the expected structure }^'*)
(***************************************************************)
ASSUME IsFiniteSet(Tasks)
ASSUME \A task \in Tasks : (\A id \in DOM(task) : id \in { "name", "repeatable", "group"})
ASSUME \A task \in Tasks : task.name \in STRING
ASSUME \A task, otherTask \in Tasks : task.name = otherTask.name => task = otherTask
ASSUME \A task \in Tasks : task.repeatable \in BOOLEAN
ASSUME \A task \in Tasks : task.group \in {"destructive", "non-destructive", "both"}

(****************************************)
(*with the following helper definitions *)
(****************************************)
TaskNames == { task.name : task \in Tasks}

unknownTask == [ name |-> "UNKNOWN", repeatable |-> FALSE, group |-> "both" ]
ASSUME unknownTask \notin Tasks
ASSUME \A task \in Tasks : task.name # unknownTask.name

Task(t) == ChooseOrDefault(Tasks, LAMBDA task : task.name = t, unknownTask)

(************************************************************)
(*`^\textbf{ GIVEN the set of connections between tasks: }^'*)
(************************************************************)
CONSTANT Connections
(*`^\begin{verbatim}
e.g. Connections ==
{   [ name |-> "has_successor", srcName |-> "EVI", dstName |-> "IVI" ]
}
\end{verbatim}^'*)
(***************************************************************)
(*`^\textbf{ such that it adheres to the expected structure }^'*)
(***************************************************************)
ASSUME IsFiniteSet(Connections)
ASSUME \A conn \in Connections :
        \A id \in DOM(conn) : id \in { "name", "srcName", "dstName"}
ASSUME \A conn \in Connections : conn.name \in
    {   "has_successor"
    ,   "has_predecessor"
    ,   "has_mandatory_predecessor"
    ,   "has_mandatory_successor"
    }
ASSUME \A conn \in Connections : \E task \in Tasks : task.name = conn.srcName
ASSUME \A conn \in Connections : \E task \in Tasks : task.name = conn.dstName
ASSUME \A conn \in Connections : conn.srcName # conn.dstName

(********************************************************************************)
(*`^\textbf{ such that the induced binary relation satisfies some properties }^'*)
(********************************************************************************)

RequiresRel[x \in TaskNames, y \in TaskNames] ==
    \E conn \in Connections :
        /\ conn.name = "has_mandatory_successor" \/ conn.name = "has_mandatory_predecessor"
        /\ conn.srcName = x
        /\ conn.dstName = y

ConRel[x \in TaskNames, y \in TaskNames] ==
    \/ \E conn \in Connections :
        /\ conn.name = "has_successor" \/ conn.name = "has_mandatory_successor"
        /\ conn.srcName = x
        /\ conn.dstName = y
    \/ \E conn \in Connections :
        /\ conn.name = "has_predecessor" \/ conn.name = "has_mandatory_predecessor"
        /\ conn.srcName = y
        /\ conn.dstName = x

TransConRel == ReflexiveTransitiveClosure(ConRel, TaskNames)

ASSUME IsIrreflexive(ConRel, TaskNames)

ASSUME Is2Acyclic(TransConRel, TaskNames)

(****************************************)
(*with the following helper definitions *)
(****************************************)
unknownConnection == [ name |-> "UNKNOWN", srcName |-> "UNKNOWN", dstName |-> "UNKNOWN" ]
ASSUME unknownConnection \notin Connections
ASSUME \A conn \in Connections : conn.name # unknownConnection.name

ErrorConn(s, d, CONSTRAINT(_, _)) ==
    IF ~CONSTRAINT(s, d)
    THEN { [ name |-> "has_successor", srcName |-> s, dstName |-> d ] }
    ELSE {}

ErrorConns(s, d, CONSTRAINT(_, _)) == { conn \in Connections : ~(
    \/
        /\ conn.name = "has_successor"
            \/ conn.name = "has_mandatory_successor"
        /\ conn.srcName = s /\ conn.dstName = d
    \/
        /\ conn.name = "has_predecessor"
            \/ conn.name = "has_mandatory_predecessor"
        /\ conn.srcName = d /\ conn.dstName = s
    => CONSTRAINT(s, d)
)}

(**************************************************************)
(*`^\textbf{ WHEN checking for errors in an input workflow }^'*)
(**************************************************************)
CONSTANT Workflow
(*`^\begin{verbatim}
e.g. Workflow == << "EVI", "IVI" >>
\end{verbatim}^'*)
(***************************************************************)
(*`^\textbf{ such that it adheres to the expected structure }^'*)
(***************************************************************)
ASSUME DOM(Workflow) = 1..Len(Workflow) \* a proper tuple
ASSUME \A t \in RAN(Workflow) : t \in STRING

=============================================================================
