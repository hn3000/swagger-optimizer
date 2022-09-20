"use strict";
exports.__esModule = true;
exports.removeOperations = exports.findOperations = void 0;
var json_ref_1 = require("@hn3000/json-ref");
var filterStep = function (schema, options) {
    var ops = findOperations(schema, options);
    if (null != ops && ops.length) {
        console.error("removing ".concat(ops.length, " operations based on tags"));
        var result = removeOperations(schema, ops, options);
        return result;
    }
    else {
        console.error('not removing any operations');
    }
    return schema;
};
exports["default"] = filterStep;
function taggedOperationMatcher(tagProp, inTags, notinTags) {
    var tagName = tagProp || 'tags';
    return function (operation, p) {
        if (p.keys.length != 3 || p.keys[0] !== 'paths') {
            return false;
        }
        var result = true;
        if (null != operation && null != operation[tagName]) {
            var tags_1 = operation[tagName];
            if (typeof tags_1 === 'string') {
                tags_1 = [tags_1];
            }
            result = null != inTags;
            if (result) {
                result = inTags.every(function (x) { return -1 === tags_1.indexOf(x); });
            }
            if (!result && null != notinTags) {
                result = notinTags.some(function (x) { return -1 !== tags_1.indexOf(x); });
            }
        }
        return result;
    };
}
function findOperations(schema, options) {
    var pointers = [];
    if (options["in"] || options.notin) {
        pointers = json_ref_1.JsonPointer.pointers(schema, taggedOperationMatcher(options.tagProp, options["in"], options.notin));
    }
    return pointers;
}
exports.findOperations = findOperations;
function removeOperations(schema, operations, options) {
    var result = JSON.parse(JSON.stringify(schema));
    operations.forEach(function (p) {
        p.deleteValue(result);
        var pathObj = p.parent.getValue(result);
        if (Object.keys(pathObj).length === 0) {
            p.parent.deleteValue(result);
        }
    });
    return result;
}
exports.removeOperations = removeOperations;
//# sourceMappingURL=filter-tagged.js.map