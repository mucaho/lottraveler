if (typeof define === 'undefined') {
    var define = (fn) => fn(require, exports, module)
}
define(function (require, exports, module) {

    module.exports = {
        all: [
            'has_successor',
            'has_predecessor',
            'has_mandatory_successor',
            'has_mandatory_predecessor'
        ],
        fwd: [
            'has_successor',
            'has_mandatory_successor'
        ],
        bwd: [
            'has_predecessor',
            'has_mandatory_predecessor'
        ]
    }
});
