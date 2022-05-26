#const maxDepth = 15.

workflow("Output").

orderNumber(0..maxDepth).

% Generate for each orderNumber potential task assignments to the workflow
{ workflowTaskAssignment(workflow(W), task(T), orderNumber(O)) : task(T) } :- workflow(W), orderNumber(O), W = "Output".

workflowOrderNumber(workflow(W), orderNumber(O)) :- workflowTaskAssignment(workflow(W), _, orderNumber(O)).
workflowTask(workflow(W), task(T)) :- workflowTaskAssignment(workflow(W), task(T), _).

% Ordernumbers must start at 0 and must be continuous
:- workflowOrderNumber(workflow(W), orderNumber(O)),
    not workflowOrderNumber(workflow(W), orderNumber(O2)),
    orderNumber(O2), O2 < O.

% Workflow breadth = 1
:- workflow(W),
    orderNumber(O),
    workflowOrderNumber(workflow(W), orderNumber(O)),
    #count { task(T) : workflowTaskAssignment(workflow(W), task(T), orderNumber(O)) } != 1.

% No errors must occur
:- error(workflow("Output"), _, _).
:- error(workflow("Output"), _, _, _).
