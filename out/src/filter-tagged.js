var json_ref_1 = require('@hn3000/json-ref');
var filterStep = function (schema, options) {
    var ops = findOperations(schema, options);
    if (null != ops && ops.length) {
        var result = removeOperations(schema, ops, options);
    }
    return schema;
};
exports["default"] = filterStep;
function taggedOperationMatcher(tagProp, inTags, notinTags) {
    var tagName = tagProp || 'tags';
    return function (operation, p) {
        if (p.keys.length != 3 || p.keys[0] !== 'operations') {
            console.log('ignoring ' + p.asString());
            return false;
        }
        if (null != operation && null != operation[tagProp]) {
            var tags = operation[tagProp];
            if (typeof tags === 'string') {
                tags = [tags];
            }
            var result = null == inTags;
            if (null != inTags) {
                result = inTags.some(function (x) { return -1 !== tags.indexOf(x); });
            }
            if (result && null != notinTags) {
                result = notinTags.every(function (x) { return -1 === tags.indexOf(x); });
            }
        }
        return false;
    };
}
function findOperations(schema, options) {
    var pointers = [], as = json_ref_1.JsonPointer[];
    if (options.in || options.notin) {
        pointers = json_ref_1.JsonPointer.pointers(schema, taggedOperationMatcher(options.tagProp, options.in, options.notin));
    }
    return pointers;
}
exports.findOperations = findOperations;
function removeOperations(schema, operations, options) {
    var result = JSON.parse(JSON.stringify(schema));
    return schema;
}
exports.removeOperations = removeOperations;
