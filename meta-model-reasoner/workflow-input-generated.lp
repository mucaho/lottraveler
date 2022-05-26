#include "workflow-generator.lp".
%%% EXAMPLE PARAMETRIZATION %%%

% Min workflow depth > 10
:- workflow(W),
    W = "Output",
    #count { orderNumber(O) : workflowOrderNumber(workflow(W), orderNumber(O)) } <= 10.

% Do not repeat task more than twice
:- workflow(W),
    W = "Output",
    task(T),
    workflowTask(workflow(W), task(T)),
    #count { orderNumber(O) : workflowTaskAssignment(workflow(W), task(T), orderNumber(O)) } > 2.
