#include "workflow-generator.lp".
#include "workflow-validator.lp".

% are there any errors in the provided workflow input?
hasError(workflow(W)) :- error(workflow(W), _, _).
hasError(workflow(W)) :- error(workflow(W), _, _, _).

% do not generate any alternate workflowTaskAssignment suggestions
% if there are not any errors in provided workflow input
:- workflowTaskAssignment(workflow("Output"), _, _),
    not hasError(workflow("Input")).

% on the other hand there must be alternate workflowTaskAssignment suggestions
% if there are any errors in provided workflow input
:- not workflowTaskAssignment(workflow("Output"), _, _),
    hasError(workflow("Input")).

% determine tasks that are not in both workflows
diffTaskExistencePos(workflow("Output"), workflow("Input"), task(T)) :-
    workflowTask(workflow("Output"), task(T)),
    not workflowTask(workflow("Input"), task(T)).
diffTaskExistenceNeg(workflow("Output"), workflow("Input"), task(T)) :-
    workflowTask(workflow("Input"), task(T)),
    not workflowTask(workflow("Output"), task(T)).

% determine tasks count difference between workflows

diffTaskCount(workflow("Output"), workflow("Input"), task(T), CGen - CInst) :-
    workflowTaskCount(workflow("Output"), task(T), count(CGen)),
    workflowTaskCount(workflow("Input"), task(T), count(CInst)).
diffTaskCount(workflow("Output"), workflow("Input"), task(T), -CInst) :-
    not workflowTaskCount(workflow("Output"), task(T), _),
    workflowTaskCount(workflow("Input"), task(T), count(CInst)).
diffTaskCount(workflow("Output"), workflow("Input"), task(T), CGen) :-
    workflowTaskCount(workflow("Output"), task(T), count(CGen)),
    not workflowTaskCount(workflow("Input"), task(T), _).

diffTaskCountPos(workflow("Output"), workflow("Input"), task(T), C) :-
    diffTaskCount(workflow("Output"), workflow("Input"), task(T), C), C > 0.
diffTaskCountPos(workflow("Output"), workflow("Input"), task(T), 0) :-
    diffTaskCount(workflow("Output"), workflow("Input"), task(T), C), C <= 0.

diffTaskCountNeg(workflow("Output"), workflow("Input"), task(T), C) :-
    diffTaskCount(workflow("Output"), workflow("Input"), task(T), C), C < 0.
diffTaskCountNeg(workflow("Output"), workflow("Input"), task(T), 0) :-
    diffTaskCount(workflow("Output"), workflow("Input"), task(T), C), C >= 0.

% determine tasks that are differently ordered in both workflows
% for a task with multiple instances this favours the same distance between task repetitions in new workflow,
%   e.g. for inst = abbab, gen = babba the differences are 1 and 2 two times respectively,
%   but since these are encoded as predicates, these differences are counted only once, instead of twice
diffTaskOrder(workflow("Output"), workflow("Input"), task(T), | OOutput - OInput |) :-
    workflowTaskAssignment(workflow("Output"), task(T), orderNumber(OOutput)),
    workflowTaskAssignment(workflow("Input"), task(T), orderNumber(OInput)).

% determine difference of workflow length
diffWorkflowLength(workflow("Output"), workflow("Input"), | OOutputMax - OInputMax |) :-
    workflowMaxOrderNumber(workflow("Output"), orderNumber(OOutputMax)),
    workflowMaxOrderNumber(workflow("Input"), orderNumber(OInputMax)).

% determine ordering difference of multiple occurrences of tasks inside output workflow

diffGenTaskOrderBetweenRepetitions(workflow("Output"), task(TA), task(TB), index(NA), index(NB), OB - OA) :-
    nthWorkflowTaskAssignment(workflow("Output"), index(NA), task(TA), orderNumber(OA)),
    nthWorkflowTaskAssignment(workflow("Output"), index(NB), task(TB), orderNumber(OB)),
    connected(task(TA), task(TB)), TA != TB,
    NB > NA.
diffGenTaskOrderBetweenRepetitions(workflow("Output"), task(TA), task(TB), index(NA), index(NB), OA - OB) :-
    nthWorkflowTaskAssignment(workflow("Output"), index(NA), task(TA), orderNumber(OA)),
    nthWorkflowTaskAssignment(workflow("Output"), index(NB), task(TB), orderNumber(OB)),
    connected(task(TA), task(TB)), TA != TB,
    NA > NB.

diffGenTaskOrderBetweenRepetitionsNeg(workflow("Output"), task(TA), task(TB), index(NA), index(NB), ODiff) :-
    diffGenTaskOrderBetweenRepetitions(workflow("Output"), task(TA), task(TB), index(NA), index(NB), ODiff), ODiff < 0.
diffGenTaskOrderBetweenRepetitionsNeg(workflow("Output"), task(TA), task(TB), index(NA), index(NB), 0) :-
    diffGenTaskOrderBetweenRepetitions(workflow("Output"), task(TA), task(TB), index(NA), index(NB), ODiff), ODiff >= 0.

% @7: minimize missing tasks compared to input, in output workflow
#maximize {  -1@7,T : diffTaskExistenceNeg(workflow("Output"), workflow("Input"), task(T)) }.
% @6: minimize additional tasks compared to input, in output workflow
#minimize {  1@6,T : diffTaskExistencePos(workflow("Output"), workflow("Input"), task(T)) }.

% @5: minimize less occurrences of a task between input and output workflow
#maximize {  C@5,T : diffTaskCountNeg(workflow("Output"), workflow("Input"), task(T), C) }.
% @4: minimize more occurrences of a task between input and output workflow
#minimize {  C@4,T : diffTaskCountPos(workflow("Output"), workflow("Input"), task(T), C) }.

% @3: minimize difference of different task order in input and output workflow
#minimize {  ODiff@3,T : diffTaskOrder(workflow("Output"), workflow("Input"), task(T), ODiff) }.

% @2: minimize difference of workflow length of input and output workflow
#minimize {  ODiff@2 : diffWorkflowLength(workflow("Output"), workflow("Input"), ODiff) }.

% @1: minimize occurrences of tasks of later repetitions before tasks of previous repetitions in the output workflow
#maximize {  ODiff@1,TA,TB,NA,NB : diffGenTaskOrderBetweenRepetitionsNeg(workflow("Output"), task(TA), task(TB), index(NA), index(NB), ODiff) }.
