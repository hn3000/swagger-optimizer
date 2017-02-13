"use strict";
var objectwalker_1 = require("./objectwalker");
function findAllOfs(schema) {
    return objectwalker_1.walkObject(schema, collectAllOf, []);
}
exports.findAllOfs = findAllOfs;
function collectAllOf(hereVal, herePath, acc) {
    //console.log(herePath.toString(), herePath.get(-1));
    if (null != hereVal && (herePath.get(-1) === 'allOf')) {
        acc.push(herePath);
    }
    return false;
}
function removeAllOfs(schema, allOfs) {
    var result = JSON.parse(JSON.stringify(schema));
    var defs = result.definitions;
    for (var _i = 0, allOfs_1 = allOfs; _i < allOfs_1.length; _i++) {
        var a = allOfs_1[_i];
        var p = a.parent;
        var target = p.getValue(result);
        var allOf = a.getValue(result);
        a.deleteValue(result);
        mergeSchemas(target, allOf, p);
    }
    return result;
}
exports.removeAllOfs = removeAllOfs;
function mergeSchemas(target, sources, path) {
    for (var _i = 0, sources_1 = sources; _i < sources_1.length; _i++) {
        var s = sources_1[_i];
        mergeIntoSchema(target, s, path);
    }
    return target;
}
function mergeIntoSchema(target, source, path) {
    //console.log("merging", source, "into", target);
    if (null != target.type && null != source.type && target.type !== source.type) {
        console.warn("different types for " + path.toString() + ": " + target.type + " !== " + source.type);
    }
    else if (null == target.type) {
        target.type = source.type;
    }
    var targetEnum = mergeEnumValues(target["enum"], source["enum"]);
    if (null != target["enum"] && target["enum"].length != 0 && targetEnum.length == 0 && null != source["enum"]) {
        console.warn("intersection of enums is empty @" + path.toString() + ": [" + targetEnum.join(',') + "] / [" + source["enum"].join(',') + "]");
    }
    target["enum"] = targetEnum;
    if (target.require && source.require) {
        target.require = arrayUnion(source.require, target.require);
    }
    else if (null == target.require) {
        target.require = source.require;
    }
    if (target.properties && source.properties) {
        target.properties = mergeProperties(source.properties, target.properties, path);
    }
    else if (null == target.properties) {
        target.properties = source.properties;
    }
}
function mergeProperties(propsA, propsB, path) {
    var result = {};
    for (var _i = 0, _a = Object.keys(propsA); _i < _a.length; _i++) {
        var k = _a[_i];
        result[k] = propsA[k];
    }
    for (var _b = 0, _c = Object.keys(propsB); _b < _c.length; _b++) {
        var k = _c[_b];
        if (null != propsA[k] && null != propsB[k]) {
            result[k] = mergeSchemas({}, [propsA[k], propsB[k]], path.add(k));
        }
        else if (null == result[k]) {
            result[k] = propsB[k];
        }
    }
    return result;
}
function mergeEnumValues(a, b) {
    if (null == a)
        return b;
    if (null == b)
        return a;
    return arrayIntersection(a, b);
}
function arrayUnion(a, b) {
    var tmp = {};
    for (var _i = 0, a_1 = a; _i < a_1.length; _i++) {
        var k = a_1[_i];
        tmp[k] = k;
    }
    for (var _a = 0, b_1 = b; _a < b_1.length; _a++) {
        var k = b_1[_a];
        tmp[k] = k;
    }
    return Object.keys(tmp);
}
function arrayIntersection(a, b) {
    var tmp = {};
    for (var _i = 0, a_2 = a; _i < a_2.length; _i++) {
        var k = a_2[_i];
        tmp[k] = 1;
    }
    for (var _a = 0, b_2 = b; _a < b_2.length; _a++) {
        var k = b_2[_a];
        tmp[k] = (tmp[k] || 0) + 1;
    }
    return Object.keys(tmp).filter(function (k) { return (tmp === 2); });
}
