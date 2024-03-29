/*globals define*/
/*eslint-env node, browser*/

/**
 * Generated by PluginGenerator 2.20.5 from webgme on Sun Sep 27 2020 11:44:31 GMT+0200 (GMT+02:00).
 * A plugin that inherits from the PluginBase. To see source code documentation about available
 * properties and methods visit %host%/docs/source/PluginBase.html.
 */

define([
    'plugin/PluginConfig',
    'text!./metadata.json',
    'plugin/PluginBase'
], function (
    PluginConfig,
    pluginMetadata,
    PluginBase) {
    'use strict';

    pluginMetadata = JSON.parse(pluginMetadata);

    /**
     * Initializes a new instance of ImportFromOntology.
     * @class
     * @augments {PluginBase}
     * @classdesc This class represents the plugin ImportFromOntology.
     * @constructor
     */
    function ImportFromOntology() {
        // Call base class' constructor.
        PluginBase.call(this);
        this.pluginMetadata = pluginMetadata;
    }

    /**
     * Metadata associated with the plugin. Contains id, name, version, description, icon, configStructure etc.
     * This is also available at the instance at this.pluginMetadata.
     * @type {object}
     */
    ImportFromOntology.metadata = pluginMetadata;

    // Prototypical inheritance from PluginBase.
    ImportFromOntology.prototype = Object.create(PluginBase.prototype);
    ImportFromOntology.prototype.constructor = ImportFromOntology;

    /**
     * Main function for the plugin to execute. This will perform the execution.
     * Notes:
     * - Always log with the provided logger.[error,warning,info,debug].
     * - Do NOT put any user interaction logic UI, etc. inside this method.
     * - callback always has to be called even if error happened.
     *
     * @param {function(Error|null, plugin.PluginResult)} callback - the result callback
     */
    ImportFromOntology.prototype.main = function (callback) {
        // Use this to access core, project, result, logger etc from PluginBase.
        const self = this;

        // prevent running this plugin without setting proper namespace
        let namespace = '';
        const libraryNames = this.core.getLibraryNames(this.rootNode);
        if (libraryNames && libraryNames.indexOf('meta') >= 0) {
            namespace = 'meta';
        }
        if (this.namespace !== namespace) {
            callback('Can not run without meta namespace!', self.result);
        }

        // This will save the changes. If you don't want to save;
        // exclude self.save and call callback directly from this scope.
        Promise.resolve()
            .then(() => {
                const { createQuery } = require('constraints-modeler/sparql/query_tasks');

                return createQuery();
            })
            .then(query => {
                const queryEndpoint = require('constraints-modeler/sparql/query');
                const { rowAccFn } = require('constraints-modeler/sparql/query_tasks');

                return queryEndpoint(query, rowAccFn);
            })
            .then(tasks => {
                const { createQuery } = require('constraints-modeler/sparql/query_connections');

                return Promise.all([tasks, createQuery()]);
            })
            .then(([tasks, query]) => {
                const queryEndpoint = require('constraints-modeler/sparql/query');
                const { rowAccFn } = require('constraints-modeler/sparql/query_connections');

                return Promise.all([tasks, queryEndpoint(query, rowAccFn)]);
            })
            .then(([tasks, connections]) => {
                return require('constraints-modeler/ImportToModel')(self, tasks, connections);
            })
            .then(() => {
                return self.save('@ImportFromOntology');
            })
            .then(() => {
                self.result.setSuccess(true);
                callback(null, self.result);
            })
            .catch((err) => {
                // Result success is false at invocation.
                self.logger.error(err.stack);
                callback(err, self.result);
            });
    };

    return ImportFromOntology;
});
