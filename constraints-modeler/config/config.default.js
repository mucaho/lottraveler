'use strict';

var config = require('./config.webgme'),
    validateConfig = require('webgme/config/validator');

// Add/overwrite any additional settings here
// config.server.port = 8080;
// config.mongo.uri = 'mongodb://127.0.0.1:27017/webgme_my_app';
config.mongo.uri = process.env.npm_package_config_MONGO_URI;

// to be able to add in the overview the ConstraintAddon to the usedAddons list
// config.addOn.enable = true;
// to be able to add constraints to meta types under the Constraints section
// config.core.enableCustomConstraints = true;

config.plugin.allowServerExecution = true;

config.server.log = {
    transports: [{
        transportType: 'Console',
        options: {
            level: 'debug',
            colorize: true,
            timestamp: true,
            prettyPrint: true,
            handleExceptions: true,
            depth: 2
        }
    }]
};

validateConfig(config);
module.exports = config;
