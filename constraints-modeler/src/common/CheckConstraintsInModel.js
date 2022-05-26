if (typeof define === 'undefined') {
    var define = (fn) => fn(require, exports, module)
}
define(function (require, exports, module) {

    var connectionTypes = require('constraints-modeler/ConnectionTypes');

    function detectCycle(model) {
        var tasks = model.tasks,
            connections = model.connections;

        var connMap = {};
        for (var conn, i = 0, l = connections.length; i < l; ++i) {
            conn = connections[i];

            if (connectionTypes.fwd.indexOf(conn.name) >= 0) {
                connMap[conn.srcName] = (connMap[conn.srcName] || []);
                connMap[conn.srcName].push(conn.dstName);
            } else if (connectionTypes.bwd.indexOf(conn.name) >= 0) {
                connMap[conn.dstName] = (connMap[conn.dstName] || []);
                connMap[conn.dstName].push(conn.srcName);
            }
        }

        var isCyclic = false;

        var visited = {};
        for (var task, i = 0, l = tasks.length; i < l; ++i) {
            task = tasks[i].name;

            if (!visited[task]) {
                isCyclic = isCyclic || _detectCycle(task, connMap, visited, {});
            }

        }

        return isCyclic;
    };

    function _detectCycle(task, connMap, visited, visitedOnPath) {
        var isCyclic = false;
        visited[task] = true;
        visitedOnPath[task] = true;

        var connectedTasks = connMap[task] || [];
        for (var connectedTask, i = 0, l = connectedTasks.length; i < l; ++i) {
            connectedTask = connectedTasks[i];

            if (!visited[connectedTask]) {
                isCyclic = isCyclic || _detectCycle(connectedTask, connMap, visited, visitedOnPath);
            }

            isCyclic = isCyclic || !!visitedOnPath[connectedTask];
        }

        visitedOnPath[task] = false;
        return isCyclic;
    };

    function detectDuplicateTasks(model) {
        var tasks = model.tasks;

        var hasDuplicates = false;

        var taskSet = {};
        for (var task, i = 0, l = tasks.length; i < l; ++i) {
            task = tasks[i].name;

            hasDuplicates = hasDuplicates || !!taskSet[task];

            taskSet[task] = true;
        }

        return hasDuplicates;
    };

    module.exports = {
        detectCycle: detectCycle,
        detectDuplicateTasks: detectDuplicateTasks
    };
});
