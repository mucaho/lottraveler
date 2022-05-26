if (typeof define === 'undefined') {
    var define = (fn) => fn(require, exports, module)
}
define(function (require, exports, module) {

    const fsPromises = require('fs').promises
    const os = require('os')
    const path = require('path')

    const baseIndent = '    '
    const ontologyPrefix = process.env.npm_package_config_ONTOLOGY_PREFIX

    const genUpdateSubjectsSelect = function (maxDepth) {
        let out = ''

        for (let i = 0; i < maxDepth; ++i) {
            out += baseIndent + `?o${i} ?p${i} ?o${i+1}.` + `${os.EOL}`
        }

        return out
    }

    const genUpdateSubjectsWhere = function (currDepth, maxDepth) {
        let out = ''

        let ident = baseIndent
        for (let i = 0; i < currDepth; ++i) {
            ident += baseIndent
        }

        out += ident + `?o${currDepth} ?p${currDepth} ?o${currDepth+1}.` + `${os.EOL}`

        if (currDepth < maxDepth) {
            out += ident + 'OPTIONAL {' + `${os.EOL}`
            out += ident + baseIndent + `FILTER( isBlank(?o${currDepth+1}) ).` + `${os.EOL}`
            out += genUpdateSubjectsWhere(currDepth+1, maxDepth)
            out += ident + '}' + `${os.EOL}`
        }

        return out
    }

    module.exports = async function createQuery(...tasksToKeep) {
        let updateSubjects = await fsPromises.readFile(path.join('src/common/sparql', 'delete_subject_tasks.rq'), 'utf8')
        const updateSubjectsDepth = Math.max(updateSubjects.match(/\$MAX_DEPTH=(\d*)/)[1], 1)

        const taskNames = tasksToKeep.map(task => `:${task.name}`)
        const tasksString = `(${taskNames.join(', ')})`

        return updateSubjects
            .replace(/\$ONTOLOGY_PREFIX/g, ontologyPrefix)
            .replace(/\$DELETE_CLAUSE/g, genUpdateSubjectsSelect(updateSubjectsDepth))
            .replace(/\$WHERE_CLAUSE_REST/g, genUpdateSubjectsWhere(0, updateSubjectsDepth))
            .replace(/\$TASKS_TO_KEEP/g, tasksString)
    }

});
