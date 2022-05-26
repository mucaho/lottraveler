%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% utility
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% utility: add default transitive property to connections missing it
has_successor(task(A), task(B), transitive(true)) :- has_successor(task(A), task(B)).
has_predecessor(task(B), task(A), transitive(true)) :- has_predecessor(task(B), task(A)).
has_mandatory_successor(task(A), task(B), transitive(true)) :- has_mandatory_successor(task(A), task(B)).
has_mandatory_predecessor(task(B), task(A), transitive(true)) :- has_mandatory_predecessor(task(B), task(A)).

% utility: construct a DAG by deriving implicit connections:
% has_predecessor and has_successor are inverse connections
edge(task(A), task(B)) :- has_successor(task(A), task(B), _).
edge(task(A), task(B)) :- has_predecessor(task(B), task(A), _).

% utility: construct a DAG by deriving implicit connections:
% mandatory task dependenies can be handled like non-mandatory task order
edge(task(A), task(B)) :- has_mandatory_successor(task(A), task(B), _).
edge(task(A), task(B)) :- has_mandatory_predecessor(task(B), task(A), _).

% utility: determine if connections are transitive
transitive(task(A), task(B)) :- has_successor(task(A), task(B), transitive(true)).
transitive(task(A), task(B)) :- has_predecessor(task(B), task(A), transitive(true)).
transitive(task(A), task(B)) :- has_mandatory_successor(task(A), task(B), transitive(true)).
transitive(task(A), task(B)) :- has_mandatory_predecessor(task(B), task(A), transitive(true)).

% utility: determine if task dependencies are mandatory
requires(task(A), task(B)) :- has_mandatory_successor(task(A), task(B), _).
requires(task(B), task(A)) :- has_mandatory_predecessor(task(B), task(A), _).

% utility: construct a the reflexive transitive closure for the DAG
connected(task(T), task(T)) :- task(T).
connected(task(A), task(B)) :- edge(task(A), task(B)).
connected(task(A), task(B)) :-
    connected(task(A), task(M)), A != M, transitive(task(A), task(M)),
    connected(task(M), task(B)), M != B, transitive(task(M), task(B)).

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% assumption checking
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% KB must be DAG <=> no 2-cycle in reflexive transitive closure
error(kb, reason(kb_not_a_directed_acyclic_graph)) :-
    connected(task(A), task(B)),
    connected(task(B), task(A)),
    A != B.

% all predicates operate on tasks, check proper references
error(kb, reason(kb_inconsistent)) :- group_non_destructive(Task), Task != task(T) : task(T).
error(kb, reason(kb_inconsistent)) :- group_destructive(Task), Task != task(T) : task(T).
error(kb, reason(kb_inconsistent)) :- repeatable(Task), Task != task(T) : task(T).
error(kb, reason(kb_inconsistent)) :- has_successor(Task, _), Task != task(T) : task(T).
error(kb, reason(kb_inconsistent)) :- has_successor(Task, _, _), Task != task(T) : task(T).
error(kb, reason(kb_inconsistent)) :- has_successor(_, Task), Task != task(T) : task(T).
error(kb, reason(kb_inconsistent)) :- has_successor(_, Task, _), Task != task(T) : task(T).
error(kb, reason(kb_inconsistent)) :- has_successor(_, _, Transitive), Transitive != transitive(true), Transitive != transitive(false).
error(kb, reason(kb_inconsistent)) :- has_predecessor(Task, _), Task != task(T) : task(T).
error(kb, reason(kb_inconsistent)) :- has_predecessor(Task, _, _), Task != task(T) : task(T).
error(kb, reason(kb_inconsistent)) :- has_predecessor(_, Task), Task != task(T) : task(T).
error(kb, reason(kb_inconsistent)) :- has_predecessor(_, Task, _), Task != task(T) : task(T).
error(kb, reason(kb_inconsistent)) :- has_predecessor(_, _, Transitive), Transitive != transitive(true), Transitive != transitive(false).
error(kb, reason(kb_inconsistent)) :- has_mandatory_successor(Task, _), Task != task(T) : task(T).
error(kb, reason(kb_inconsistent)) :- has_mandatory_successor(Task, _, _), Task != task(T) : task(T).
error(kb, reason(kb_inconsistent)) :- has_mandatory_successor(_, Task), Task != task(T) : task(T).
error(kb, reason(kb_inconsistent)) :- has_mandatory_successor(_, Task, _), Task != task(T) : task(T).
error(kb, reason(kb_inconsistent)) :- has_mandatory_successor(_, _, Transitive), Transitive != transitive(true), Transitive != transitive(false).
error(kb, reason(kb_inconsistent)) :- has_mandatory_predecessor(Task, _), Task != task(T) : task(T).
error(kb, reason(kb_inconsistent)) :- has_mandatory_predecessor(Task, _, _), Task != task(T) : task(T).
error(kb, reason(kb_inconsistent)) :- has_mandatory_predecessor(_, Task), Task != task(T) : task(T).
error(kb, reason(kb_inconsistent)) :- has_mandatory_predecessor(_, Task, _), Task != task(T) : task(T).
error(kb, reason(kb_inconsistent)) :- has_mandatory_predecessor(_, _, Transitive), Transitive != transitive(true), Transitive != transitive(false).
