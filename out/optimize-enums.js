"use strict";
exports.__esModule = true;
exports.filterEnums = exports.optimizeEnums = exports.findEnums = void 0;
var json_ref_1 = require("@hn3000/json-ref");
function findEnums(schema, fn) {
    var queue = [schema];
    var paths = [new json_ref_1.JsonPointer("")];
    var enums = [];
    var count = 0;
    while (0 !== queue.length) {
        var thisOne = queue[0];
        var thisPath = paths[0];
        queue.splice(0, 1);
        paths.splice(0, 1);
        if (count % 100 == 99) {
            //console.log(`examining ${thisPath}`);
        }
        ++count;
        var props = Object.keys(thisOne);
        var _loop_1 = function () {
            if (thisOne[p]) {
                if (thisOne[p]["enum"] != null) {
                    var values_1 = thisOne[p]["enum"];
                    var name = p;
                    if (name === 'items') {
                        var segs = thisPath.keys.slice();
                        name = segs.pop();
                    }
                    else if (name === 'type') {
                        var segs = thisPath.keys.slice();
                        if (segs[segs.length - 1] == 'properties') {
                            segs.pop();
                        }
                        name = segs.pop() + 'Type';
                    }
                    else if (/^\d+$/.test(name)) {
                        return "continue";
                    }
                    var prev = enums.filter(function (x) { return sameValuesAllowed(values_1, x.values); });
                    if (0 !== prev.length) {
                        var entry = prev[0];
                        entry.where.push(thisPath.toString());
                        entry.paths.push(thisPath);
                        entry.props.push(p);
                        if (-1 === entry.names.indexOf(name)) {
                            entry.names.push(name);
                        }
                    }
                    else {
                        enums.push({
                            values: values_1,
                            props: [p],
                            name: name,
                            names: [name],
                            where: [thisPath.toString()],
                            paths: [thisPath]
                        });
                    }
                }
                else if (p[0] != '$' && ('object' === typeof thisOne[p])) {
                    queue.push(thisOne[p]);
                    paths.push(thisPath.add(p));
                }
            }
        };
        for (var _i = 0, props_1 = props; _i < props_1.length; _i++) {
            var p = props_1[_i];
            _loop_1();
        }
    }
    for (var _a = 0, enums_1 = enums; _a < enums_1.length; _a++) {
        var e = enums_1[_a];
        e.name = e.names.reduce(function (a, b) { return (a.length <= b.length ? a : b); });
    }
    return enums;
}
exports.findEnums = findEnums;
function sameEnum(a, b) {
    return a.type === b.type && a["enum"] && b["enum"] && sameValuesAllowed(a["enum"], b["enum"]);
}
function optimizeEnums(schema, enums, version) {
    var result = JSON.parse(JSON.stringify(schema));
    var defs = version.definitionsPath.getValue(result);
    var defsPath = version.definitionsPath.asString();
    if (undefined == defs) {
        console.warn("  no definitions found at ".concat(version.definitionsPath.toString()));
    }
    for (var _i = 0, enums_2 = enums; _i < enums_2.length; _i++) {
        var e = enums_2[_i];
        var p = e.paths[0].add(e.props[0]);
        var t = p.getValue(result);
        var nname = "".concat(e.name.substring(0, 1).toUpperCase()).concat(e.name.substring(1));
        if (defs[nname] && !sameEnum(defs[nname], t)) {
            console.warn("  possibly overwriting definition for ".concat(nname), defs[nname], t);
        }
        defs[nname] = t;
        var ref = { "$ref": "#".concat(defsPath, "/").concat(nname) };
        for (var i = 0, n = e.paths.length; i < n; ++i) {
            p = e.paths[i].add(e.props[i]);
            p.setValue(result, ref);
        }
    }
    return result;
}
exports.optimizeEnums = optimizeEnums;
function sameValuesAllowed(a, b) {
    return (a.length === b.length
        && a.every(function (xa) { return b.some(function (xb) { return xb === xa; }); })
        && b.every(function (xb) { return a.some(function (xa) { return xb === xa; }); }));
}
function filterEnums(enums, argv) {
    var redundantEnums = enums.filter(function (e) { return (e.props.length >= 1 && e.values.length > 1); });
    if (argv['optimizeNumericEnums']) {
        redundantEnums = redundantEnums.filter(function (e) { return (e.values.every(function (x) { return (typeof x === 'number'); })); });
    }
    if (argv['optimizeSimpleEnums']) {
        redundantEnums = redundantEnums.filter(function (e) { return (e.values.every(function (x) { return (typeof x === 'number'); })); });
    }
    return redundantEnums;
}
exports.filterEnums = filterEnums;
//# sourceMappingURL=optimize-enums.js.map