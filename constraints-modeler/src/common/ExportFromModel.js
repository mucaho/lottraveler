if (typeof define === 'undefined') {
    var define = (fn) => fn(require, exports, module)
}
define(function (require, exports, module) {

    module.exports = async function ExportFromModel(self) {
        self.logger.debug('Start of ExportFromModel');

        const nodes = await self.loadNodeMap(self.rootNode);

        const model = reduceNodes(self, nodes, self.rootNode, {
            tasks: [],
            connections: []
        }, extractModel);

        self.logger.debug('End of ExportFromModel', 'tasks:', model.tasks, 'connections:', model.connections);

        return model;
    }

    function reduceNodes(self, nodes, node, acc, accFn) {
        acc = accFn(self, nodes, acc, node);

        var childrenPaths = self.core.getChildrenPaths(node);
        for (var i = 0; i < childrenPaths.length; ++i) {
            var childNode = nodes[childrenPaths[i]];
            reduceNodes(self, nodes, childNode, acc, accFn);
        }

        return acc;
    }

    function extractModel(self, nodes, acc, node) {
        if (self.isMetaTypeOf(node, self.META.Task) && self.core.getBaseType(node) !== node) {
            addTask(self, nodes, acc, node);
        } else if (self.isMetaTypeOf(node, self.META.Connection) && self.core.isConnection(node)) {
            addConnection(self, nodes, acc, node);
        }

        return acc;
    }

    function addTask(self, nodes, acc, node) {
        var task = {};

        task.name = self.core.getAttribute(node, 'name');
        task.repeatable = self.core.getAttribute(node, 'repeatable');
        task.group = self.core.getAttribute(node, 'group');
        task.importedName = self.core.getRegistry(node, 'importedName');

        acc.tasks.push(task);
    }

    function addConnection(self, nodes, acc, node) {
        var srcPath = self.core.getPointerPath(node, 'src');
        var dstPath = self.core.getPointerPath(node, 'dst');

        if (srcPath && dstPath) {
            var connection = {};
            connection.name = self.core.getAttribute(node, 'name');
            connection.transitive = self.core.getAttribute(node, 'transitive') !== '';
            connection.srcName = self.core.getAttribute(nodes[srcPath], 'name');
            connection.dstName = self.core.getAttribute(nodes[dstPath], 'name');

            acc.connections.push(connection);
        }
    }

});
