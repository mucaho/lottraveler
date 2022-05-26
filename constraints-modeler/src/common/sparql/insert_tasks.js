if (typeof define === 'undefined') {
    var define = (fn) => fn(require, exports, module)
}
define(function (require, exports, module) {

    const fsPromises = require('fs').promises
    const path = require('path')

    const ontologyPrefix = process.env.npm_package_config_ONTOLOGY_PREFIX

    module.exports = async function createQuery(...tasks) {
        if (tasks.length === 0) return Promise.resolve('INSERT {} WHERE { FILTER(false). }');

        const insertTasks = await fsPromises.readFile(path.join('src/common/sparql', 'insert_tasks.rq'), 'utf8')

        let tasksString = tasks.length === 0 ? '(UNDEF UNDEF UNDEF)' : ''
        for (const task of tasks) {
            tasksString += `(:${task.name} "${task.group}"^^xsd:string "${task.repeatable}"^^xsd:boolean)`
        }

        return insertTasks
            .replace(/\$ONTOLOGY_PREFIX/g, ontologyPrefix)
            .replace(/\$TASKS_WITH_DATA/g, tasksString)
    }

});
