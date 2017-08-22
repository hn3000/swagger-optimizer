var json_ref_1 = require('@hn3000/json-ref');
function findEnums(schema, fn) {
    var defs = schema.definitions;
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
        }
        ++count;
        var props = Object.keys(thisOne);
        for (var _i = 0; _i < props.length; _i++) {
            var p = props[_i];
            if (thisOne[p]) {
                if (thisOne[p].enum != null) {
                    var values = thisOne[p].enum;
                    var name_1 = p;
                    if (name_1 === 'items') {
                        var segs = thisPath.keys;
                        name_1 = segs.pop();
                    }
                    else if (/^\d+$/.test(name_1)) {
                        // skip parameters
                        continue;
                    }
                    var prev = enums.filter(function (x) { return sameValuesAllowed(values, x.values); });
                    if (0 !== prev.length) {
                        var entry = prev[0];
                        entry.where.push(thisPath.toString());
                        entry.paths.push(thisPath);
                        entry.props.push(p);
                        if (-1 === entry.names.indexOf(name_1)) {
                            entry.names.push(name_1);
                        }
                    }
                    else {
                        enums.push({
                            values: values,
                            props: [p],
                            name: name_1,
                            names: [name_1],
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
        }
    }
    for (var _a = 0; _a < enums.length; _a++) {
        var e = enums[_a];
        e.name = e.names.reduce(function (a, b) { return (a.length <= b.length ? a : b); });
    }
    return enums;
}
exports.findEnums = findEnums;
function optimizeEnums(schema, enums) {
    var result = JSON.parse(JSON.stringify(schema));
    var defs = result.definitions;
    for (var _i = 0; _i < enums.length; _i++) {
        var e = enums[_i];
        var p = e.paths[0].add(e.props[0]);
        var t = p.getValue(result);
        var nname = "" + e.name.substring(0, 1).toUpperCase() + e.name.substring(1);
        defs[nname] = t;
        var ref = { "$ref": "#/definitions/" + nname };
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
    var redundantEnums = enums.filter(function (e) { return (e.props.length > 1 && e.values.length > 1); });
    if (argv['optimizeNumericEnums']) {
        redundantEnums = redundantEnums.filter(function (e) { return (e.values.every(function (x) { return (typeof x === 'number'); })); });
    }
    if (argv['optimizeSimpleEnums']) {
        redundantEnums = redundantEnums.filter(function (e) { return (e.values.every(function (x) { return (typeof x === 'number'); })); });
    }
    return redundantEnums;
}
exports.filterEnums = filterEnums;
