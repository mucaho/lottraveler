FROM node:12-alpine
RUN apk add --no-cache tini
RUN apk add --no-cache curl
RUN apk add --no-cache clingo

ADD https://raw.githubusercontent.com/eficode/wait-for/master/wait-for /bin/wait-for.sh
RUN chmod +rx /bin/wait-for.sh

USER node
RUN mkdir -p /home/node/app
WORKDIR /home/node/app

COPY --chown=node:node package*.json ./
ENV NODE_ENV=production
RUN npm ci --only=production

COPY --chown=node:node . .
COPY --chown=node:node ./kbdata ./kbdata
VOLUME [ "/home/node/app/kbdata" ]

HEALTHCHECK --start-period=60s --interval=60s --timeout=15s --retries=5 \
  CMD curl -f http://localhost:8080/ || exit 1

EXPOSE 8080

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "app.js"]
