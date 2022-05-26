if (typeof define === 'undefined') {
    var define = (fn) => fn(require, exports, module)
}
define(function (require, exports, module) {

    const fsPromises = require('fs').promises
    const os = require('os')
    const path = require('path')

    const baseIndent = '    '
    const ontologyPrefix = process.env.npm_package_config_ONTOLOGY_PREFIX

    const genUpdateConnectionsSelect = function (maxDepth) {
        let out = ''

        for (let i = -maxDepth + 1; i < maxDepth; ++i) {
            if (i < 0) {
                out += baseIndent + `?o_bwd_${-i} ?p_bwd_${-i} ?o_bwd_${-i-1}.` + `${os.EOL}`
            } else if (i > 0) {
                out += baseIndent + `?o_fwd_${+i-1} ?p_fwd_${+i} ?o_fwd_${+i}.` + `${os.EOL}`
            } else {
                out += baseIndent + `?o_bwd_${0} ?p_bwd_${0} ?o.` + `${os.EOL}`
                out += baseIndent + `?o ?p_fwd_${0} ?o_fwd_${0}.` + `${os.EOL}`
            }
        }

        return out
    }

    const genUpdateConnectionsWhereBwd = function (currDepth, maxDepth) {
        let out = ''

        let ident = baseIndent
        for (let i = 0; i < -currDepth; ++i) {
            ident += baseIndent
        }

        out += ident + 'OPTIONAL {' + `${os.EOL}`

        if (-currDepth === 0) {
            out += ident + baseIndent + `?o_bwd_${0} ?p_bwd_${0} ?o.` + `${os.EOL}`
        } else {
            out += ident + baseIndent + `FILTER( isBlank(?o_bwd_${-currDepth-1}) ).` + `${os.EOL}`
            out += ident + baseIndent + `?o_bwd_${-currDepth} ?p_bwd_${-currDepth} ?o_bwd_${-currDepth-1}.` + `${os.EOL}`
        }

        if (-currDepth < maxDepth) {
            out += genUpdateConnectionsWhereBwd(currDepth-1, maxDepth)
        }

        out += ident + '}' + `${os.EOL}`

        return out
    }

    const genUpdateConnectionsWhereFwd = function (currDepth, maxDepth) {
        let out = ''

        let ident = baseIndent
        for (let i = 0; i < +currDepth; ++i) {
            ident += baseIndent
        }

        out += ident + 'OPTIONAL {' + `${os.EOL}`

        if (+currDepth === 0) {
            out += ident + baseIndent + `?o ?p_fwd_${+currDepth} ?o_fwd_${+currDepth}.` + `${os.EOL}`
        } else {
            out += ident + baseIndent + `FILTER( isBlank(?o_fwd_${+currDepth-1}) ).` + `${os.EOL}`
            out += ident + baseIndent + `?o_fwd_${+currDepth-1} ?p_fwd_${+currDepth} ?o_fwd_${+currDepth}.` + `${os.EOL}`
        }

        if (+currDepth < maxDepth) {
            out += genUpdateConnectionsWhereFwd(currDepth+1, maxDepth)
        }

        out += ident + '}' + `${os.EOL}`

        return out
    }

    const genUpdateConnectionsWhere = function (maxDepth) {
        let out = ''

        out += genUpdateConnectionsWhereBwd(0, maxDepth)
        out += genUpdateConnectionsWhereFwd(0, maxDepth)

        return out
    }

    module.exports = async function createQuery(...connectionTypes) {
        if (connectionTypes.length === 0) return Promise.resolve('INSERT {} WHERE { FILTER(false). }');

        let updateConnections = await fsPromises.readFile(path.join('src/common/sparql', 'delete_connections.rq'), 'utf8')
        const updateConnectionsDepth = Math.max(updateConnections.match(/\$MAX_DEPTH=(\d*)/)[1], 1)

        let connectionsString = connectionTypes.length === 0 ? '(UNDEF)' : ''
        for (const type of connectionTypes) {
            connectionsString += `(:${type}) `
        }

        return updateConnections
            .replace(/\$ONTOLOGY_PREFIX/g, ontologyPrefix)
            .replace(/\$DELETE_CLAUSE/g, genUpdateConnectionsSelect(updateConnectionsDepth))
            .replace(/\$WHERE_CLAUSE_REST/g, genUpdateConnectionsWhere(updateConnectionsDepth))
            .replace(/\$CONNECTION_TYPES/g, connectionsString)
    }

});
