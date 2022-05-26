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
            const queryTasksMethods = await fsPromises.readFile(path.join('src/common/sparql', 'query_tasks_methods.rq'), 'utf8');

            return queryTasksMethods
                .replace(/\$ONTOLOGY_PREFIX/g, ontologyPrefix);
        },
        rowAccFn: (row) => {
            const method = 'method' in row && row['method'].termType === 'NamedNode' ? extractAnchorName(row['method'].value) : null;
            const task =  'task' in row && row['task'].termType === 'NamedNode' ? extractAnchorName(row['task'].value) : null;
            return method !== null && task !== null ? { method, task } : null;
        }
    };

});
