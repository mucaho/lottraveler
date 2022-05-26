---------------------- MODULE WorkflowDefinitionPretty ----------------------
EXTENDS WorkflowDefinition

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
