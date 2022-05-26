if (typeof define === 'undefined') {
    var define = (fn) => fn(require, exports, module)
}
define(function (require, exports, module) {

    const SparqlClient = require('sparql-http-client');

    const endpointUrl = process.env.npm_package_config_FUSEKI_URI;
    const auth = process.env.npm_package_config_FUSEKI_AUTH;

    module.exports = async function fetchFromOntology(query, rowAccFn, resultsMapFn) {
        return Promise.resolve()
                .then(() => {
                    const client = new SparqlClient({
                        endpointUrl,
                        headers: {
                            Authorization: auth
                        }
                    });

                    return client.query.select(query);
                })
                .then(responseStream => {
                    return new Promise((resolve, reject) => {
                        const results = [];
                        responseStream.on('error', reject);
                        responseStream.on('end', () => {
                            const finalResults = resultsMapFn ? resultsMapFn(results) : results;
                            resolve(finalResults);
                        });
                        responseStream.on('data', row => {
                            const result = rowAccFn(row);
                            if (result !== null) {
                                results.push(result);
                            }
                        });
                    });
                });
    }

});
