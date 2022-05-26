if (typeof define === 'undefined') {
    var define = (fn) => fn(require, exports, module)
}
define(function (require, exports, module) {

    const connectionTypes = require('constraints-modeler/ConnectionTypes').all;

    module.exports = async function ImportToModel(self, tasks, connections) {
        self.logger.debug('Start of ImportToModel', 'tasks:', tasks, 'connections:', connections);

        let nodes = await self.loadNodeMap(self.rootNode);

        removeOldNodes(self, nodes, self.rootNode);

        for (const task of tasks) {
            addTaskNode(self, task);
        }

        nodes = await self.loadNodeMap(self.rootNode);

        const nameToNodeMap = {};
        for (const [path, node] of Object.entries(nodes)) {
            nameToNodeMap[self.core.getAttribute(node, 'name')] = node;
        }
        // self.logger.debug('nameToNodeMap', nameToNodeMap);

        for (const connection of connections) {
            addConnectionNode(self, nameToNodeMap, connection);
        }

        self.logger.debug('End of ImportToModel');
    }

    function removeOldNodes(self, nodes, node) {
        var childrenPaths = self.core.getChildrenPaths(node);
        for (var i = 0; i < childrenPaths.length; ++i) {
            var childNode = nodes[childrenPaths[i]];
            if (!self.core.isLibraryRoot(childNode)) {
                removeOldNodes(self, nodes, childNode);
            }
        }

        const isTask = self.isMetaTypeOf(node, self.META.Task)
                        && self.getMetaType(node) !== node
                        && self.core.getBaseType(node) !== node
                        && self.baseIsMeta(node);
        const isConnection = self.isMetaTypeOf(node, self.META.Connection) && self.core.isConnection(node);

        if (isTask || isConnection) {
            self.logger.debug('Removing old node:', self.core.getAttribute(node, 'name'));
            self.core.deleteNode(node);
        }
    }

    function addTaskNode(self, task) {
        self.logger.debug('Adding task:', task.name);

        const node = self.core.createNode({
            parent: self.rootNode,
            base: self.META.Task
        });
        self.core.setAttribute(node, 'name', task.name);
        self.core.setAttribute(node, 'repeatable', task.repeatable);
        self.core.setAttribute(node, 'group', task.group);
        // save the original, imported name for later export of renamed tasks
        self.core.setRegistry(node, 'importedName', task.name);
    }

    function addConnectionNode(self, nameToNodeMap, connection) {
        const metaNode = connectionTypes.includes(connection.name)
            ? self.META[connection.name]
            : undefined;
        const { transitive } = connection;
        const srcNode = nameToNodeMap[connection.srcName];
        const dstNode = nameToNodeMap[connection.dstName];

        if (typeof metaNode !== 'undefined' && typeof transitive !== 'undefined'
                && typeof srcNode !== 'undefined' && typeof dstNode !== 'undefined') {

            const connectionSymbol = transitive ? '~~' : '--';
            self.logger.debug(
                'Adding connection:',
                `${connection.srcName} ${connectionSymbol}[${connection.name}]${connectionSymbol}> ${connection.dstName}`
            );

            const node = self.core.createNode({
                parent: self.rootNode,
                base: metaNode
            });
            self.core.setAttribute(node, 'name', self.core.getAttribute(metaNode, 'name'));
            self.core.setAttribute(node, 'transitive', transitive);
            self.core.setPointer(node, 'src', srcNode);
            self.core.setPointer(node, 'dst', dstNode);
        }
    }

});
