%#include "kb-facts.lp".
#include "kb-validator.lp".

% make sure these predicates are defined
workflowOrderNumber(workflow(W), orderNumber(O)) :- workflowTaskAssignment(workflow(W), _, orderNumber(O)).
workflowTask(workflow(W), task(T)) :- workflowTaskAssignment(workflow(W), task(T), _).

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% utility
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% utility: workflow length
workflowMaxOrderNumber(workflow(W), orderNumber(OMax)) :-
    workflowTaskAssignment(workflow(W), _, orderNumber(OMax)), orderNumber(OMax),
    #count { orderNumber(OAny) : workflowTaskAssignment(workflow(W), _, orderNumber(OAny)), orderNumber(OAny), OAny > OMax } = 0.

% utility: nth assignment of a task in workflow
nthWorkflowTaskAssignment(workflow(W), index(N), task(T), orderNumber(O)) :-
    workflowTaskAssignment(workflow(W), task(T), orderNumber(O)), orderNumber(O),
    #count { orderNumber(OAny) : workflowTaskAssignment(workflow(W), task(T), orderNumber(OAny)), orderNumber(OAny), OAny < O } = N.

% utility: first assignment of a task in workflow
firstWorkflowTaskAssignment(workflow(W), task(T), orderNumber(OMin)) :-
    workflowTaskAssignment(workflow(W), task(T), orderNumber(OMin)), orderNumber(OMin),
    #count { orderNumber(OAny) : workflowTaskAssignment(workflow(W), task(T), orderNumber(OAny)), orderNumber(OAny), OAny < OMin } = 0.

% utility: latest assignment of a task in workflow
latestWorkflowTaskAssignment(workflow(W), task(T), orderNumber(OMax)) :-
    workflowTaskAssignment(workflow(W), task(T), orderNumber(OMax)), orderNumber(OMax),
    #count { orderNumber(OAny) : workflowTaskAssignment(workflow(W), task(T), orderNumber(OAny)), orderNumber(OAny), OAny > OMax } = 0.

% utility: count occurences of task in workflow
workflowTaskCount(workflow(W), task(T), count(C)) :-
    workflow(W),
    task(T),
    workflowTask(workflow(W), task(T)),
    #count { orderNumber(O) : workflowTaskAssignment(workflow(W), task(T), orderNumber(O)) } = C.

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% workflow validation
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% check that all given workflowTasks exist
error(workflow(W), reason(unknown_task), task(T)) :-
    workflow(W),
    workflowTask(workflow(W), task(T)),
    not task(T).

% check that non-repeatable tasks can only occur once in workflow
error(workflow(W), reason(non_repeatable), task(T)) :-
    workflow(W),
    task(T),
    workflowTask(workflow(W), task(T)),
    not repeatable(task(T)),
    #count { orderNumber(O) : workflowTaskAssignment(workflow(W), task(T), orderNumber(O)) } != 1.

% check that no destructive tasks comes before non-destructive one
error(workflow(W), reason(destructive_before_non_destructive_task), task(TD)) :-
    workflow(W),
    task(TD), group_destructive(task(TD)), not group_non_destructive(task(TD)),
    orderNumber(OD), workflowTaskAssignment(workflow(W), task(TD), orderNumber(OD)),
    TD != TN,
    task(TN), group_non_destructive(task(TN)), not group_destructive(task(TN)),
    orderNumber(ON), workflowTaskAssignment(workflow(W), task(TN), orderNumber(ON)),
    OD < ON.

% check that task order for non-repeatable predecessor tasks and non-repeatable sucessor tasks is satisfied
error(workflow(W), reason(partial_order_violation), task(TA), task(TB)) :-
    not repeatable(task(TA)),
    workflowTaskAssignment(workflow(W), task(TA), orderNumber(OA)), orderNumber(OA),
    connected(task(TA), task(TB)), TA != TB, % not shortCircuit(task(TA), task(TB)),
    not repeatable(task(TB)),
    workflowTaskAssignment(workflow(W), task(TB), orderNumber(OB)), orderNumber(OB),
    OA > OB.

% check that task order for repeatable predecessor tasks and non-repeatable sucessor tasks is satisfied
error(workflow(W), reason(partial_order_violation), task(TA), task(TB)) :-
    repeatable(task(TA)),
    latestWorkflowTaskAssignment(workflow(W), task(TA), orderNumber(OAMax)), orderNumber(OAMax),
    connected(task(TA), task(TB)), TA != TB, % not shortCircuit(task(TA), task(TB)),
    not repeatable(task(TB)),
    workflowTaskAssignment(workflow(W), task(TB), orderNumber(OB)), orderNumber(OB),
    OAMax > OB.

% check that task order for non-repeatable predecessor tasks and repeatable sucessor tasks is satisfied
error(workflow(W), reason(partial_order_violation), task(TA), task(TB)) :-
    not repeatable(task(TA)),
    workflowTaskAssignment(workflow(W), task(TA), orderNumber(OA)), orderNumber(OA),
    connected(task(TA), task(TB)), TA != TB, % not shortCircuit(task(TA), task(TB)),
    repeatable(task(TB)),
    firstWorkflowTaskAssignment(workflow(W), task(TB), orderNumber(OBMin)), orderNumber(OBMin),
    OA > OBMin.

% check that there is always a mandatory successor task after the dependent task
error(workflow(W), reason(missing_mandatory_dependency_task), task(TA), task(TB)) :-
    TA != TB,
    connected(task(TA), task(TB)),
    requires(task(TA), task(TB)),
    workflowTaskAssignment(workflow(W), task(TA), orderNumber(OA)),
    #count { OB : workflowTaskAssignment(workflow(W), task(TB), orderNumber(OB)), OB > OA, orderNumber(OB) } = 0.

% check that there is always a mandatory predecessor task before the dependent task
error(workflow(W), reason(missing_mandatory_dependency_task), task(TA), task(TB)) :-
    TB != TA,
    connected(task(TA), task(TB)),
    requires(task(TB), task(TA)),
    workflowTaskAssignment(workflow(W), task(TB), orderNumber(OB)),
    #count { OA : workflowTaskAssignment(workflow(W), task(TA), orderNumber(OA)), OA < OB, orderNumber(OA) } = 0.

% check that the dependent task does not repeat itself before the mandatory successor task
error(workflow(W), reason(missing_mandatory_dependency_task_between_repetitions), task(TA), task(TB)) :-
    TA != TB,
    repeatable(task(TA)),
    repeatable(task(TB)),
    connected(task(TA), task(TB)),
    requires(task(TA), task(TB)),
    workflowTaskAssignment(workflow(W), task(TA), orderNumber(OA)),
    workflowTaskAssignment(workflow(W), task(TA), orderNumber(OA2)),
    OA < OA2,
    #count { OB : workflowTaskAssignment(workflow(W), task(TB), orderNumber(OB)), OA < OB, OB < OA2, orderNumber(OB) } = 0.

% check that the dependent task does not repeat itself after the mandatory predecessor task
error(workflow(W), reason(missing_mandatory_dependency_task_between_repetitions), task(TA), task(TB)) :-
    TB != TA,
    repeatable(task(TB)),
    repeatable(task(TA)),
    connected(task(TA), task(TB)),
    requires(task(TB), task(TA)),
    workflowTaskAssignment(workflow(W), task(TB), orderNumber(OB)),
    workflowTaskAssignment(workflow(W), task(TB), orderNumber(OB2)),
    OB2 < OB,
    #count { OA : workflowTaskAssignment(workflow(W), task(TA), orderNumber(OA)), OB2 < OA, OA < OB, orderNumber(OA) } = 0.

% display relevant facts
#show workflowTaskAssignment/3.
#show error/2.
#show error/3.
#show error/4.
