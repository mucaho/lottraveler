# LotTraveler: Meta-model reasoner

## Description

Contains the "workflow validation and repair" reasoner.
It is a web-service providing methods `/updateKnowledgeBase` for updating the business domain tasks and their connections, `/validate` for validating a workflow against these constraints and `/repair` for repairing an invalid workflow by providing a valid, similar workflow suggestion.
In the background an answer set programming solver `clingo` is used to reason about these properties.

Accessible at [http://localhost:8080/](http://localhost:8080/).

## Installation

First, install the following:

- [NodeJS](https://nodejs.org/en/) (v12 LTS recommended)
- [clingo@5.4.0](https://potassco.org/clingo/).
  Follow the instructions there to install the command line tool.

## Workflow validation and repair

### Web service

- To spin-up the reasoner as a web service, run `npm start`.
  Navigate to `http://localhost:8080/` and follow the on-screen prompts to try out the web-service's POST methods.
  The OpenAPI spec of the web-service is also hosted there.
  Press `CTRL-C` when you are done.

- You can run `npm test` to run a series of end-to-end tests contained in `app.test.js`.

### Example scripts

You can run the following commands, or node scripts, alternatively.

- Run `$ clingo kb-facts.lp workflow-input-generated.lp workflow-validator.lp` to generate a valid workflow for a sample.
   Alternatively, run `$ npm run generate`.
    Example output:

    ```sh
    $ clingo kb-facts.lp workflow-input-generated.lp workflow-validator.lp
    clingo version 5.4.0
    Reading from kb-facts.lp ...
    Solving...
    Answer: 1
    workflowTaskAssignment(workflow("Output"),task("EVI"),orderNumber(0))
    workflowTaskAssignment(workflow("Output"),task("SEM"),orderNumber(1))
    workflowTaskAssignment(workflow("Output"),task("XRAY_MIC"),orderNumber(2))
    workflowTaskAssignment(workflow("Output"),task("EPT"),orderNumber(3))
    workflowTaskAssignment(workflow("Output"),task("DECAP"),orderNumber(4))
    workflowTaskAssignment(workflow("Output"),task("IVI"),orderNumber(5))
    workflowTaskAssignment(workflow("Output"),task("STRIP"),orderNumber(6))
    workflowTaskAssignment(workflow("Output"),task("XRAY_SPEC"),orderNumber(7))
    workflowTaskAssignment(workflow("Output"),task("TEM"),orderNumber(8))
    workflowTaskAssignment(workflow("Output"),task("SAM"),orderNumber(9))
    workflowTaskAssignment(workflow("Output"),task("STRIP"),orderNumber(10))
    SATISFIABLE

    Models       : 1+
    Calls        : 1
    Time         : 0.143s (Solving: 0.00s 1st Model: 0.00s Unsat: 0.00s)
    CPU Time     : 0.131s
    ```

- Run `$ clingo kb-facts.lp workflow-input-error.lp workflow-validator.lp` to display errors in a provided workflow instance for a sample.
   Alternatively, run `$ npm run validate`.
    Example output:

    ```sh
    $ clingo kb-facts.lp workflow-input-error.lp workflow-validator.lp
    clingo version 5.4.0
    Reading from kb-facts.lp ...
    Solving...
    Answer: 1
    workflowTaskAssignment(workflow("Input"),task("EPT"),orderNumber(0))
    workflowTaskAssignment(workflow("Input"),task("EVI"),orderNumber(1))
    error(workflow("Input"),reason(partial_order_violation),task("EVI"),task("EPT"))
    SATISFIABLE

    Models       : 1
    Calls        : 1
    Time         : 0.008s (Solving: 0.00s 1st Model: 0.00s Unsat: 0.00s)
    CPU Time     : 0.008s
    ```

- Run `$ clingo kb-facts.lp workflow-input-error.lp workflow-repairer.lp` to get a recommendation of a similar, but valid workflow.
   Alternatively, run `$ npm run repair`.
    Example output:

    ```sh
    $ clingo kb-facts.lp workflow-input-error.lp workflow-repairer.lp
    clingo version 5.4.0
    Reading from kb-facts.lp ...
    Solving...
    Answer: 1
    workflowTaskAssignment(workflow("Input"),task("EPT"),orderNumber(0))
    workflowTaskAssignment(workflow("Input"),task("EVI"),orderNumber(1))
    error(workflow("Input"),reason(partial_order_violation),task("EVI"),task("EPT"))
    workflowTaskAssignment(workflow("Output"),task("EVI"),orderNumber(0))
    Optimization: 1 0 1 0 1 1 0
    Answer: 2
    workflowTaskAssignment(workflow("Input"),task("EPT"),orderNumber(0))
    workflowTaskAssignment(workflow("Input"),task("EVI"),orderNumber(1))
    error(workflow("Input"),reason(partial_order_violation),task("EVI"),task("EPT"))
    workflowTaskAssignment(workflow("Output"),task("EVI"),orderNumber(0))
    workflowTaskAssignment(workflow("Output"),task("EPT"),orderNumber(1))
    Optimization: 0 0 0 0 2 0 0
    OPTIMUM FOUND

    Models       : 2
      Optimum    : yes
    Optimization : 0 0 0 0 2 0 0
    Calls        : 1
    Time         : 3.560s (Solving: 0.56s 1st Model: 0.11s Unsat: 0.42s)
    CPU Time     : 3.550s
    ```
