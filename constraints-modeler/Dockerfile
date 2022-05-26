FROM node:12-alpine
RUN apk add --no-cache git
RUN apk add --no-cache tini
RUN apk add --no-cache curl

ADD https://raw.githubusercontent.com/eficode/wait-for/master/wait-for /bin/wait-for.sh
RUN chmod +rx /bin/wait-for.sh

USER node
RUN mkdir -p /home/node/app
WORKDIR /home/node/app

COPY --chown=node:node package*.json ./
ENV NODE_ENV=production
#RUN npm ci --only=production
RUN npm install --only=production

COPY --chown=node:node . .

HEALTHCHECK --start-period=60s --interval=60s --timeout=15s --retries=5 \
  CMD curl -f http://localhost:8888/ || exit 1

EXPOSE 8888

#ENV npm_package_config_MONGO_URI=mongodb://127.0.0.1:27017/constraints_modeler
#ENV npm_package_config_ONTOLOGY_PREFIX=<http://community.infineon.com/sites/smart-FA-lab/Semantic%20Search/FAOntologyV5#>
#ENV npm_package_config_FUSEKI_URI=http://127.0.0.1:3030/FAOntology
#ENV npm_package_config_FUSEKI_AUTH=Basic YWRtaW46YWRtaW4=
#ENV npm_package_config_REASONER_URI=http://127.0.0.1:8080
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "app.js"]
