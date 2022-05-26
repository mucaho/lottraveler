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
            const queryTasks = await fsPromises.readFile(path.join('src/common/sparql', 'query_tasks.rq'), 'utf8');

            return queryTasks
                .replace(/\$ONTOLOGY_PREFIX/g, ontologyPrefix);
        },
        rowAccFn: (row) => {
            const name = row['task'].termType === 'NamedNode' ? extractAnchorName(row['task'].value) : null;
            const group = 'groupValue' in row
                    && row['groupValue'].termType === 'Literal'
                    && row['groupValue'].datatype.termType === 'NamedNode'
                    && row['groupValue'].datatype.value === 'http://www.w3.org/2001/XMLSchema#string'
                ? row['groupValue'].value
                : null;
            const repeatable = 'repeatableValue' in row
                    && row['repeatableValue'].termType === 'Literal'
                    && row['repeatableValue'].datatype.termType === 'NamedNode'
                    && row['repeatableValue'].datatype.value === 'http://www.w3.org/2001/XMLSchema#boolean'
                ? row['repeatableValue'].value === 'true'
                : null;

            return name !== null
                ? {
                    name,
                    importedName: name,
                    group: group !== null ? group : 'both',
                    repeatable: repeatable !== null ? repeatable : false
                }
                : null;
        }
    };

});
