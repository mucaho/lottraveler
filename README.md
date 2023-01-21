# LotTraveler

Implementation of the LotTraveler system, as described in the respective [master-thesis](https://resolver.obvsg.at/urn:nbn:at:at-ubk:1-45251).

## Project structure

This README gives a general overview of the project.
More detailed READMEs for each part of the application can be found in the linked subdirectories:

* [constraints-modeler](constraints-modeler/README.md):

  Contains the visual modeler which is used to model (partial-order, mandatory) dependencies between tasks / methods.
  It is the central component which connects the ontology to the "workflow validation and repair" reasoner.
  Tasks and their connections can be imported from the ontology, modified, and then exported back to the ontology.
  Tasks and connections can also be exported to the reasoner, to update its knowledge base.

  Accessible at [http://localhost:8888/](http://localhost:8888/).

* [constraints-ontology](constraints-ontology/README.md):

  Contains the current version of Infineon's `FAOntology` which provides a sort of taxonomy of the company's business domain, which also contains information about FA tasks and their dependencies.

  The ontology is hosted using a fuseki server, accessible at [http://localhost:3030/](http://localhost:3030/).

* [docker-stack](docker-stack/README.md):

  The docker stacks builds all relevant services for the complete LotTraveler usage pipeline to work properly.
  It can be run locally, as well as be deployed to a container orchestration platform.

* [meta-model-reasoner](meta-model-reasoner/README.md):

  Contains the "workflow validation and repair" reasoner.
  It is a web-service providing methods `/updateKnowledgeBase` for updating the business domain tasks and their connections, `/validate` for validating a workflow against these constraints and `/repair` for repairing an invalid workflow by providing a valid, similar workflow suggestion.
  In the background an answer set programming solver `clingo` is used to reason about these properties.

  Accessible at [http://localhost:8080/](http://localhost:8080/).

* [problem-specification](problem-specification/README.md):

  Contains the input & output encodings and describes the properties of "workflow validation and repair" in a formal, tool-agnostic way.
  This specification is then used primarily in the master thesis to describe the problem in an unambiguous way, but also to assert expectation as tests against it, compare and (manually) verify the inner workings of the "workflow validation and repair" reasoner implementation.

* [thesis](thesis/thesis.pdf):

  Contains a link to the master thesis about this project, a presentation about the master thesis, as well as corrigenda for the thesis.

## Install

For running the base services, the following must be installed:

* [NodeJS](https://nodejs.org/en/) (v12 LTS recommended)
* [Docker community edition](https://hub.docker.com/editions/community/docker-ce-desktop-windows/)

## Running

Run `npm start` from this top-level directory to spin up all base services.
When you are done, run `npm stop`.
