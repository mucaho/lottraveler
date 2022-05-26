workflow("Input").

orderNumber(0..1).

% example invalid workflow
workflowTaskAssignment(workflow("Input"), task("EPT"), orderNumber(0)).
workflowTaskAssignment(workflow("Input"), task("EVI"), orderNumber(1)).
