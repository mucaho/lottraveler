%$ clingo --outf=1 --warn no-atom-undefined kb-facts.lp workflow-input-error.lp workflow-repairer.lp

% clingo version 5.4.0
% Reading from kb-facts.lp ...
% Solving...
% Answer: 2
ANSWER
workflowTaskAssignment(workflow("Input"),task("EPT"),orderNumber(0)).
workflowTaskAssignment(workflow("Input"),task("EVI"),orderNumber(1)).
error(workflow("Input"),reason(partial_order_violation),task("EVI"),task("EPT")).
workflowTaskAssignment(workflow("Output"),task("EVI"),orderNumber(0)).
workflowTaskAssignment(workflow("Output"),task("EPT"),orderNumber(1)).
COST 0 0 0 0 2 0 0
OPTIMUM
%
% Models         : 2
%   Optimum      : yes
% Optimization   : 0 0 0 0 2 0 0
% Calls          : 1
% Time           : 3.558s (Solving: 0.58s 1st Model: 0.12s Unsat: 0.43s)
% CPU Time       : 3.544s
