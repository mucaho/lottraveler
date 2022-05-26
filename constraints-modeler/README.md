# LotTraveler: Constraints Modeler

## Description

Contains the visual modeler which is used to model (partial-order, mandatory) dependencies between tasks / methods.
It is the central component which connects the ontology to the "workflow validation and repair" reasoner.
Tasks and their connections can be imported from the ontology, modified, and then exported back to the ontology.
Taks and connections can also be exported to the reasoner, to update its knowledge base.

Accessible at [http://localhost:8888/](http://localhost:8888/).

## Installation

First, install the following:

- [NodeJS](https://nodejs.org/en/) (v12 LTS recommended)
- [Docker community edition](https://hub.docker.com/editions/community/docker-ce-desktop-windows/)
  Docker is required to start relevant dependencies, a mongo database and a fuseki ontology server.

## Usage

Second, start the mongodb docker container, using `npm run mongo:start`, aswell as the fuseki container using `npm run fuseki:start`.

Afterwards, navigate to the fuseki server at `http://localhost:3030/`, log-in with user & password `admin`, followed by creating a new dataset `FAOntology` using the latest `contraints-ontology/FAOntologyV?_ex.rdf` file.

Then, run `npm run webgme:start` from the project root to start the webgme server.

Finally, navigate to `http://localhost:8888`. Create a new project and choose to import the local `constraints-modeler.webgmex` or `model-template.webgmex` file.
If you want to save your work, export the project again into the same file.

For the `model-template` project, you can run the `ImportFromOntology` plugin (using the `meta` namespace) to update the current model with data from the fuseki ontology.
For the `model-template` project, you can run the `ExportToOntology` plugin (using the `meta` namespace) to update the the fuseki ontology with the data from the current model.

You can view the new ontology in `Protege`, by opening it from the fuseki url: `http://localhost:3030/FAOntology`.
If you are satisfied with the changes, you can save this new version of the ontology to `contraints-ontology/FAOntologyV?.rdf`.

You can run the `UpdateReasoner` plugin (using the `meta` namespace) in the `ROOT` composition view, which will
update the knowledge base of the "workflow validation and repair" reasoner.
Furthermore, this plugin will generate a `kb-facts.json` file which can be downloaded and used to update the reasoner manually.

After you are finished, `CTRL-C` the webgme server and `npm run mongo:stop` to teardown the temporary mongo server and `npm run fuseki:stop` to teardown the fuseki server.

## SPARQL scripts

Tests for SPARQL queries of importing tasks and connections from the ontology, as well as exporting those to the ontology are located in [src/common/sparql/test.js](src/common/sparql/test.js).

These can be run using `node src/common/sparql/test.js`, however be careful as these modify the ontology!
They are mostly used to check that rdf triples are inserted and deleted properly, and that the import / export logic is idempotent such that the count of all triples stays the same after repeating the same queries.
