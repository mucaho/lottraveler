%$ clingo --outf=1 --warn no-atom-undefined kb-facts.lp workflow-input-generated.lp workflow-validator.lp

% clingo version 5.4.0
% Reading from kb-facts.lp ...
% Solving...
% Answer: 1
ANSWER
workflowTaskAssignment(workflow("Output"),task("EVI"),orderNumber(0)).
workflowTaskAssignment(workflow("Output"),task("SEM"),orderNumber(1)).
workflowTaskAssignment(workflow("Output"),task("XRAY_MIC"),orderNumber(2)).
workflowTaskAssignment(workflow("Output"),task("EPT"),orderNumber(3)).
workflowTaskAssignment(workflow("Output"),task("DECAP"),orderNumber(4)).
workflowTaskAssignment(workflow("Output"),task("IVI"),orderNumber(5)).
workflowTaskAssignment(workflow("Output"),task("STRIP"),orderNumber(6)).
workflowTaskAssignment(workflow("Output"),task("XRAY_SPEC"),orderNumber(7)).
workflowTaskAssignment(workflow("Output"),task("TEM"),orderNumber(8)).
workflowTaskAssignment(workflow("Output"),task("SAM"),orderNumber(9)).
workflowTaskAssignment(workflow("Output"),task("STRIP"),orderNumber(10)).
%
% Models         : 1+
% Calls          : 1
% Time           : 0.121s (Solving: 0.01s 1st Model: 0.01s Unsat: 0.00s)
% CPU Time       : 0.120s
