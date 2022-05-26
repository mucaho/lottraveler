if (typeof define === 'undefined') {
    var define = (fn) => fn(require, exports, module)
}
define(function (require, exports, module) {

    const fsPromises = require('fs').promises
    const os = require('os')
    const path = require('path')

    const baseIndent = '    '
    const ontologyPrefix = process.env.npm_package_config_ONTOLOGY_PREFIX

    const genUpdateObjectsSelect = function (maxDepth) {
        let out = ''

        for (let i = 0; i < maxDepth; ++i) {
            out = baseIndent + `?o${i+1} ?p${i} ?o${i}.` + `${os.EOL}` + out
        }

        return out
    }

    const genUpdateObjectsWhere = function (currDepth, maxDepth) {
        let out = ''

        let ident = baseIndent
        for (let i = 0; i < currDepth; ++i) {
            ident += baseIndent
        }

        out += ident + `?o${currDepth+1} ?p${currDepth} ?o${currDepth}.` + `${os.EOL}`

        if (currDepth < maxDepth) {
            out += ident + 'OPTIONAL {' + `${os.EOL}`
            out += ident + baseIndent + `FILTER( isBlank(?o${currDepth+1}) ).` + `${os.EOL}`
            out += genUpdateObjectsWhere(currDepth+1, maxDepth)
            out += ident + '}' + `${os.EOL}`
        }

        return out
    }

    module.exports = async function createQuery(...tasksToKeep) {
        let updateObjects = await fsPromises.readFile(path.join('src/common/sparql', 'delete_object_tasks.rq'), 'utf8')
        const updateObjectsDepth = Math.max(updateObjects.match(/\$MAX_DEPTH=(\d*)/)[1], 1)

        const taskNames = tasksToKeep.map(task => `:${task.name}`)
        const tasksString = `(${taskNames.join(', ')})`

        return updateObjects
            .replace(/\$ONTOLOGY_PREFIX/g, ontologyPrefix)
            .replace(/\$DELETE_CLAUSE/g, genUpdateObjectsSelect(updateObjectsDepth))
            .replace(/\$WHERE_CLAUSE_REST/g, genUpdateObjectsWhere(0, updateObjectsDepth))
            .replace(/\$TASKS_TO_KEEP/g, tasksString)
    }

});
