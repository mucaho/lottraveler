if (typeof define === 'undefined') {
    var define = (fn) => fn(require, exports, module)
}
define(function (require, exports, module) {

    const fsPromises = require('fs').promises
    const path = require('path')

    const ontologyPrefix = process.env.npm_package_config_ONTOLOGY_PREFIX

    module.exports = async function createQuery(...oldAndNewTasks) {
        if (oldAndNewTasks.length === 0) return Promise.resolve('INSERT {} WHERE { FILTER(false). }');

        const updateObjects = await fsPromises.readFile(path.join('src/common/sparql', 'update_object_tasks.rq'), 'utf8')

        let tasksString = oldAndNewTasks.length === 0 ? '(UNDEF UNDEF)' : ''
        for (const task of oldAndNewTasks) {
            tasksString += `(:${task.importedName} :${task.name})`
        }

        return updateObjects
            .replace(/\$ONTOLOGY_PREFIX/g, ontologyPrefix)
            .replace(/\$OLD_AND_NEW_TASK_PAIRS/g, tasksString)
    }

});
