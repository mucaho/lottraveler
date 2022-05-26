const os = require('os');
const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const tmp = require('tmp');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const specDocument = require('./openapi.json');
const OpenApiValidator = require('express-openapi-validator').OpenApiValidator;

const port = 8080;

let serverResolve;
let serverPromise = new Promise(res => {
    serverResolve = res;
});
let server = null;

const ENV = (process.env.NODE_ENV || '').trim();
const kbFactsPath = ENV === 'production' ? './kbdata/kb-facts.lp' : './kb-facts-test.lp';
function log(...args) {
    if (ENV !== 'test' && ENV !== 'production') console.log.apply(console, args);
    // console.log.apply(console, args);
}

tmp.setGracefulCleanup();

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send(`
        <!doctype html>
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <title>Meta-model-reasoner web-service</title>
        </head>
        <body>
            <h1>Welcome to meta-model-reasoner!</h1>
            <p>Navigate to <a href="api-docs">/api-docs</a> to discover and try-out the API.</p>
            <p>OpenAPI spec is available at <a href="spec">/spec</a>.</p>
        </body>
        </html>
    `);
});

const specPath = path.join(__dirname, 'openapi.json');
app.use('/spec', express.static(specPath));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specDocument));

new OpenApiValidator({
    apiSpec: specDocument,
    validateRequests: true,
    validateResponses: true,
    validateFormats: 'full',
    operationHandlers: false
})
.install(app)
.then(setupRoutes);

function setupRoutes() {
    app.post('/updateKnowledgeBase', (req, res, next) => {
        const [err, kbDataInput] = stringifyKBData(req.body);
        if (err) {
            return next(err);
        }

        writeToTempFile(kbDataInput, (err, tmpFilePath, tmpFileCleanupCallback) => {
            if (err) {
                if (tmpFileCleanupCallback) tmpFileCleanupCallback();
                return next(err);
            }

            executeLogicProgram(tmpFilePath, 'KB_UPDATE', (err, logicOutput) => {
                if (err) {
                    if (tmpFileCleanupCallback) tmpFileCleanupCallback();
                    return next(err);
                }

                const [parseError, logicOutputFormatted] = extractLogicOutput(logicOutput);
                if (parseError) {
                    if (tmpFileCleanupCallback) tmpFileCleanupCallback();
                    return next(parseError);
                }

                if (tmpFileCleanupCallback) tmpFileCleanupCallback();

                if ('errors' in logicOutputFormatted && logicOutputFormatted.errors.length === 0) {
                    writeToFile(kbFactsPath, kbDataInput, (err) => {
                        if (err) {
                            return next(err);
                        }

                        res.json(logicOutputFormatted);
                    });
                } else {
                    res.json(logicOutputFormatted);
                }
            });
        });
    });

    app.get('/getKnowledgeBase', (req, res, next) => {
        executeLogicProgram(undefined, 'KB_GET', (err, logicOutput) => {
            if (err) {
                return next(err);
            }

            const [parseError, logicOutputFormatted] = extractKBData(logicOutput);
            if (parseError) {
                return next(parseError);
            }

            res.json(logicOutputFormatted);
        });
    });

    app.post('/validate', (req, res, next) => {
        const logicInputFormatted = req.body;
        const [err, logicInput] = stringifyLogicInput(logicInputFormatted);
        if (err) {
            return next(err);
        }

        writeToTempFile(logicInput, (err, tmpFilePath, tmpFileCleanupCallback) => {
            if (err) {
                if (tmpFileCleanupCallback) tmpFileCleanupCallback();
                return next(err);
            }

            executeLogicProgram(tmpFilePath, 'VALIDATE', (err, logicOutput) => {
                if (err) {
                    if (tmpFileCleanupCallback) tmpFileCleanupCallback();
                    return next(err);
                }

                const [parseError, logicOutputFormatted] = extractLogicOutput(logicOutput);
                if (parseError) {
                    if (tmpFileCleanupCallback) tmpFileCleanupCallback();
                    return next(parseError);
                }

                if (tmpFileCleanupCallback) tmpFileCleanupCallback();
                res.json(logicOutputFormatted);
            });
        });
    });

    app.post('/repair', (req, res, next) => {
        const logicInputFormatted = req.body;
        const [err, logicInput] = stringifyLogicInput(logicInputFormatted);
        if (err) {
            return next(err);
        }

        writeToTempFile(logicInput, (err, tmpFilePath, tmpFileCleanupCallback) => {
            if (err) {
                if (tmpFileCleanupCallback) tmpFileCleanupCallback();
                return next(err);
            }

            executeLogicProgram(tmpFilePath, 'REPAIR', (err, logicOutput) => {
                if (err) {
                    if (tmpFileCleanupCallback) tmpFileCleanupCallback();
                    return next(err);
                }

                const [parseError, logicOutputFormatted] = extractLogicOutput(logicOutput);
                if (parseError) {
                    if (tmpFileCleanupCallback) tmpFileCleanupCallback();
                    return next(parseError);
                }

                if (tmpFileCleanupCallback) tmpFileCleanupCallback();
                res.json(logicOutputFormatted);
            });
        });
    });

    app.use((err, req, res, next) => {
        // format error
        res.status(err.status || 500).json({
            message: err.message || err,
            params: err.params || {},
            errors: err.errors || [],
        });
    });

    server = app.listen(port, () => {
        log(`Meta-model-reasoner listening at http://localhost:${port}`);
        serverResolve();
    });
}

function stringifyKBData(rules) {
    let [err, kbDataInput] = [undefined, ''];

    try {
        rules.tasks.forEach(function(task) {
            kbDataInput += 'task("' + task.name + '").\n';

            if (task.group === 'destructive') {
                kbDataInput += 'group_destructive(task("' + task.name + '")).\n';
            } else if (task.group === 'non-destructive') {
                kbDataInput += 'group_non_destructive(task("' + task.name + '")).\n';
            } else if (task.group === 'both') {
                kbDataInput += 'group_destructive(task("' + task.name + '")).\n';
                kbDataInput += 'group_non_destructive(task("' + task.name + '")).\n';
            }

            if (task.repeatable === true) {
                kbDataInput += 'repeatable(task("' + task.name + '")).\n';
            }
        });

        rules.connections.forEach(function(connection) {
            kbDataInput += connection.name + '('
                + 'task("' + connection.srcName + '")'
                + ', '
                + 'task("' + connection.dstName + '")'
                + ', '
                + 'transitive(' + !!connection.transitive + ')'
                + ').\n';

        });
    } catch (ex) {
        err = {
            message: 'Stringify kbData error!',
            errors: [ ex ],
            params: { rules }
        };
    }

    return [err, kbDataInput];
}

function extractKBData(facts) {
    let [err, kbDataOutput] = [undefined, {}];

    try {
        const tasks = [];
        const connections = [];

        const taskMap = {};
        for (const fact of facts) {
            if (fact.startsWith('task')) {
                const taskName = fact.replace(/^task\("(.*)"\)$/g, '$1');
                log(taskName);

                const task = taskMap[taskName] || {
                    name: "",
                    repeatable: false,
                    group: "both"
                };
                task.name = taskName;
                taskMap[taskName] = task;

            } else if (fact.startsWith('repeatable')) {
                repeatableFactArgs = fact.replace(/^repeatable\((.*)\)$/g, '$1').split(',');
                log(repeatableFactArgs);

                const taskName = repeatableFactArgs[0].replace(/^task\("(.*)"\)$/g, '$1');
                const task = taskMap[taskName] || {
                    name: "",
                    repeatable: false,
                    group: "both"
                };
                task.name = taskName;
                task.repeatable = true;
                taskMap[taskName] = task;

            } else if (fact.startsWith('group_destructive')) {
                groupFactArgs = fact.replace(/^group_destructive\((.*)\)$/g, '$1').split(',');
                log(groupFactArgs);

                const taskName = groupFactArgs[0].replace(/^task\("(.*)"\)$/g, '$1');
                const task = taskMap[taskName] || {
                    name: "",
                    repeatable: false,
                    group: "both"
                };
                task.name = taskName;
                task.group = task.group !== 'non-destructive' ? 'destructive' : 'both';
                taskMap[taskName] = task;

            } else if (fact.startsWith('group_non_destructive')) {
                groupFactArgs = fact.replace(/^group_non_destructive\((.*)\)$/g, '$1').split(',');
                log(groupFactArgs);

                const taskName = groupFactArgs[0].replace(/^task\("(.*)"\)$/g, '$1');
                const task = taskMap[taskName] || {
                    name: "",
                    repeatable: false,
                    group: "both"
                };
                task.name = taskName;
                task.group = task.group !== 'destructive' ? 'non-destructive' : 'both';
                taskMap[taskName] = task;

            } else if (fact.startsWith('has_successor')) {
                const connection = extractKBConnection(fact, 'has_successor');
                connections.push(connection);

            } else if (fact.startsWith('has_predecessor')) {
                const connection = extractKBConnection(fact, 'has_predecessor');
                connections.push(connection);

            } else if (fact.startsWith('has_mandatory_successor')) {
                const connection = extractKBConnection(fact, 'has_mandatory_successor');
                connections.push(connection);

            } else if (fact.startsWith('has_mandatory_predecessor')) {
                const connection = extractKBConnection(fact, 'has_mandatory_predecessor');
                connections.push(connection);
            }
        }

        for (const taskName in taskMap) {
            tasks.push(taskMap[taskName]);
        }

        kbDataOutput.tasks = tasks;
        kbDataOutput.connections = connections;

        log('kbDataOutput', kbDataOutput);
    } catch (ex) {
        err = {
            message: 'Extract kbDataOutput error!',
            errors: [ ex ],
            params: { facts }
        };
    }

    return [err, kbDataOutput];
}

function extractKBConnection(fact, connectionName) {
    connectionFactArgs = fact.replace(new RegExp(`^${connectionName}\\((.*)\\)$`, 'g'), '$1').split(',');
    log(connectionFactArgs);

    const srcTask = connectionFactArgs[0].replace(/^task\("(.*)"\)$/g, '$1');
    const dstTask = connectionFactArgs[1].replace(/^task\("(.*)"\)$/g, '$1');
    const transitive = connectionFactArgs[2].replace(/^transitive\((.*)\)$/g, '$1') === 'true';

    return {
        name: connectionName,
        transitive: transitive,
        srcName: srcTask,
        dstName: dstTask
    };
}

function stringifyLogicInput(taskNames) {
    let [err, logicInput] = [undefined, ''];

    try {
        logicInput += `${os.EOL}workflow("Input").`
        logicInput += `${os.EOL}orderNumber(0..${taskNames.length - 1}).`;
        for (const [i, taskName] of taskNames.entries()) {
            logicInput += `${os.EOL}workflowTaskAssignment(workflow("Input"), task("${taskName}"), orderNumber(${i})).`
        }
        logicInput += os.EOL;

        log('logicInput', logicInput);
    } catch (ex) {
        err = {
            message: 'Stringify taskNames error!',
            errors: [ ex ],
            params: { taskNames }
        };
    }

    return [err, logicInput];
}

function extractLogicOutput(facts) {
    let [err, logicOutput] = [undefined, {}];

    try {
        const errors = [];
        const recommendation = [];

        for (const fact of facts) {
            if (fact.startsWith('error')) {
                errorFactArgs = fact.replace(/^error\((.*)\)$/g, '$1').split(',');
                log(errorFactArgs);

                const error = {
                    errorCode: errorFactArgs[1],
                    description: errorFactArgs[1]
                };
                for (let i = 2; i < errorFactArgs.length; ++i) {
                    error[`errorArg${i - 2}`] = errorFactArgs[i];
                }
                errors.push(error);
            } else if (fact.startsWith('workflowTaskAssignment(workflow("Output")')) {
                recommendedFactArgs = fact.replace(/^workflowTaskAssignment\((.*)\)$/g, '$1').split(',');
                log(recommendedFactArgs);

                const taskName = recommendedFactArgs[1].replace(/^task\("(.*)"\)$/g, '$1');
                const orderNumber = +recommendedFactArgs[2].replace(/^orderNumber\((.*)\)$/g, '$1');
                recommendation[orderNumber] = taskName;
            }
        }

        logicOutput.errors = errors;
        if (recommendation.length > 0) {
            logicOutput.recommendation = recommendation;
        }

        log('logicOutput', logicOutput);
    } catch (ex) {
        err = {
            message: 'Extract logicOutput error!',
            errors: [ ex ],
            params: { facts }
        };
    }

    return [err, logicOutput];
}

function writeToFile(filePath, fileContent, callback) {
    fs.writeFile(filePath, fileContent, (err) => {
        if (err) return callback({
            message: err.message || err,
            errors: err.errors || [],
            params: { fileContent }
        });

        log('File created: ', filePath);

        callback(undefined);
    });
}

function writeToTempFile(fileContent, callback) {
    tmp.file({ prefix: 'workflow-input-', postfix: '.lp', discardDescriptor: true }, (err, tmpFilePath, _, tmpFileCleanupCallback) => {
        if (err) return callback({
            message: err.message || err,
            errors: err.errors || [],
            params: { fileContent }
        }, undefined, undefined);

        log('Temp file created: ', tmpFilePath);

        fs.writeFile(tmpFilePath, fileContent, (err) => {
            if (err) return callback({
                message: err.message || err,
                errors: err.errors || [],
                params: { fileContent }
            }, undefined, tmpFileCleanupCallback);

            log('The file has been saved!');

            callback(undefined, tmpFilePath, tmpFileCleanupCallback);
        });
    });
}

function executeLogicProgram(tmpFilePath, mode, callback) {
    const modeOptions = mode.startsWith('KB')
        ? (mode === 'KB_UPDATE' ? `${tmpFilePath} kb-validator.lp` : `${kbFactsPath} kb-display.lp`)
        : `${kbFactsPath} ${tmpFilePath} ${mode === 'VALIDATE' ? 'workflow-validator.lp' : 'workflow-repairer.lp'}`;
    const clingoOptions = '--outf=2 --quiet=1 --time-limit=60 -W no-atom-undefined';

    cp.exec(`clingo ${clingoOptions} ${modeOptions} || true`, { timeout: 60 * 1000 }, (err, stdout, stderr) => {
        if (err) return callback(err, undefined);
        if (stderr) return callback({
            message: 'Clingo stderr occurred!',
            errors: [ stderr ]
        }, undefined);
        if (!stdout) return callback('Clingo stdout empty!', undefined);

        log(`stdout: ${stdout}`);

        let logicOutput = '';
        try {
            logicOutput = JSON.parse(stdout).Call[0].Witnesses[0].Value;
        } catch (ex) {
            return callback({
                message: 'Clingo stdout parsing error!',
                errors: [ ex ],
                params: { stdout }
            }, undefined);
        }

        log('logicOutput', logicOutput);

        callback(undefined, logicOutput);
    });
}

module.exports = {
    open: () => {
        return serverPromise;
    },
    close: () => {
        const close = require('util').promisify(server.close.bind(server));
        return server !== null ? close() : undefined;
    }
}
