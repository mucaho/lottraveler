if (typeof define === 'undefined') {
    var define = (fn) => fn(require, exports, module)
}
define(function (require, exports, module) {

    const fsPromises = require('fs').promises;
    const path = require('path');

    const ontologyPrefix = process.env.npm_package_config_ONTOLOGY_PREFIX

    function extractAnchorName(iri) {
        return iri.substring(iri.indexOf("#") + 1);
    }

    module.exports = {
        createQuery: async function createQuery() {
            const queryConnections = await fsPromises.readFile(path.join('src/common/sparql', 'query_connections.rq'), 'utf8');

            return queryConnections
                .replace(/\$ONTOLOGY_PREFIX/g, ontologyPrefix);
        },
        rowAccFn: (row) => {
            const name = row['property'].termType === 'NamedNode' ? extractAnchorName(row['property'].value) : null;

            // FIXME: ontology considers all connections as transitive for now, if distinction needed in future, uncomment
            // const transitive = row['transitive'].termType === 'Literal'
            //     && row['transitive'].datatype.termType === 'NamedNode'
            //     && row['transitive'].datatype.value === 'http://www.w3.org/2001/XMLSchema#boolean'
            //         ? row['transitive'].value === 'true'
            //         : null;
            const transitive = true;

            const srcName = row['task'].termType === 'NamedNode' ? extractAnchorName(row['task'].value) : null;
            const dstName = row['other_task'].termType === 'NamedNode' ? extractAnchorName(row['other_task'].value) : null;

            return name !== null && transitive !== null && srcName !== null && dstName !== null
                    ? { name, transitive, srcName, dstName }
                    : null;
        }
    };

});
