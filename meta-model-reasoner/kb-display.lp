% utility: add default transitive property to connections missing it
has_successor(task(A), task(B), transitive(true)) :- has_successor(task(A), task(B)).
has_predecessor(task(B), task(A), transitive(true)) :- has_predecessor(task(B), task(A)).
has_mandatory_successor(task(A), task(B), transitive(true)) :- has_mandatory_successor(task(A), task(B)).
has_mandatory_predecessor(task(B), task(A), transitive(true)) :- has_mandatory_predecessor(task(B), task(A)).

% display tasks
#show task/1.
#show group_non_destructive/1.
#show group_destructive/1.
#show repeatable/1.

% display connections
#show has_successor/3.
#show has_predecessor/3.
#show has_mandatory_successor/3.
#show has_mandatory_predecessor/3.
