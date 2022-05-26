if (typeof define === 'undefined') {
    var define = (fn) => fn(require, exports, module)
}
define(function (require, exports, module) {

    const fsPromises = require('fs').promises
    const path = require('path')

    const ontologyPrefix = process.env.npm_package_config_ONTOLOGY_PREFIX

    module.exports = async function createQuery(...connections) {
        if (connections.length === 0) return Promise.resolve('INSERT {} WHERE { FILTER(false). }');

        const insertConnections = await fsPromises.readFile(path.join('src/common/sparql', 'insert_connections.rq'), 'utf8')

        let connString = connections.length === 0 ? '(UNDEF UNDEF UNDEF UNDEF)' : ''
        for (const conn of connections) {
            // FIXME: ontology considers all connections as transitive for now, if distinction needed in future, uncomment
            // const transitive = !!conn.transitive ? '"true"^^xsd:boolean' : '"false"^^xsd:boolean'
            const transitive = '"false"^^xsd:boolean'

            connString += `(:${conn.srcName} :${conn.name} :${conn.dstName} ${transitive})`
        }

        return insertConnections
            .replace(/\$ONTOLOGY_PREFIX/g, ontologyPrefix)
            .replace(/\$CONNECTIONS_WITH_DATA/g, connString)
    }

});
