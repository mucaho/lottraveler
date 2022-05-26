if (typeof define === 'undefined') {
    var define = (fn) => fn(require, exports, module)
}
define(function (require, exports, module) {

    const SparqlClient = require('sparql-http-client');
    const os = require('os');

    const updateUrl = process.env.npm_package_config_FUSEKI_URI;
    const auth = process.env.npm_package_config_FUSEKI_AUTH;

    module.exports = async function updateToOntology(...queries) {
        const client = new SparqlClient({
            updateUrl,
            headers: {
                Authorization: auth
            }
        });
        const query = queries.join(`${os.EOL};${os.EOL}`);
        // console.error('query', query);
        return client.query.update(query);
    }

});
