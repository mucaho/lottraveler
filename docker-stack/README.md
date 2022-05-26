# LotTraveler: Docker Stack

## Desscription

The docker stacks builds all relevant services for the complete LotTraveler usage pipeline to work properly.
It can be run locally, as an alternative to running the top-level scripts.
This stack of services can then be deployed on Infineon's openshift platform.

## HowTo

* Change working directory to this (docker-stack) directory
* Use `docker-compose build --no-cache` to build all docker images for this stack
* Use `docker-compose up` to start running all services, press `Ctrl+C` to stop
* Alternatively use `docker-compose up -d` to run all services in the background. Once done, stop using `docker-compose stop`
* Open `localhost:3030`, `localhost:8888` and `localhost:8080` in your preferred web-browser to access the ontology, modeler and reasoner service, respectively (listed in order of usage scenarios). Make sure to read the `README.md` files in other subdirectories for detailed information on how to use those specific services.
* You can restart again with `docker-compose up` or with `docker-compose up -d`, preserving the data from before.
  * If fuseki complains about an outdated lock, connect to the running docker service via `docker exec -ti docker-stack_fuseki_1 /bin/sh`, run `rm /fuseki/system/tdb.lock` and then `exit`.
    Stop and restart the services.
* If you need to start from fresh use `docker-compose rm` to remove all service registrations and persistent volumes.

[//]: # "`docker volume rm docker-stack_kbdata` to remove the shared volume between services."

## Scripts

For convenience, you can run `npm start` and `npm stop` from this directory to get a clean complete stack setup and shutdown.

## Diagnosing problems

* Use `docker ps` to list all running containers.
* Alternatively, use `docker-compose ps` to list all running services.
* Use `docker exec -ti $CONTAINER_OR_SERVICE_NAME /bin/sh` to connect to the running container / service, to be able to debug errors. Disconnect with `exit`.
