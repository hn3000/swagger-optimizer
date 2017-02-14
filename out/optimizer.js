#! /usr/bin/env node
"use strict";
var fs = require('fs');
var mm = require('minimist');
var jsonref = require('@hn3000/json-ref');
var proc = new jsonref.JsonReferenceProcessor(fetchFile);
var jp = jsonref.JsonPointer;
var optimize_enums_1 = require("./optimize-enums");
var remove_allofs_1 = require("./remove-allofs");
var argv = mm(process.argv.slice(2));
var useLogging = !argv.printOutput;
function consoleLog(msg) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    useLogging && console.log.apply(console, [msg].concat(args));
}
consoleLog(argv);
for (var i = 0, n = argv._.length; i < n; ++i) {
    var fn = argv._[i];
    var sp;
    if (argv['deref']) {
        sp = proc.expandRef(fn);
    }
    else {
        sp = fetchFile(fn).then(function (x) { return JSON.parse(x); });
    }
    sp.then(function (schema) {
        consoleLog("hunting for instances of enum and allOf in " + fn, Object.keys(schema));
        var enums = optimize_enums_1.findEnums(schema, fn);
        var redundantEnums = optimize_enums_1.filterEnums(enums, argv);
        var allOfs = remove_allofs_1.findAllOfs(schema);
        if (null != argv['rename']) {
            var nameMap = JSON.parse(argv['rename']);
            for (var _i = 0, redundantEnums_1 = redundantEnums; _i < redundantEnums_1.length; _i++) {
                var e = redundantEnums_1[_i];
                if (null != nameMap[e.name]) {
                    var newName = nameMap[e.name];
                    e.name = newName;
                }
            }
        }
        if (argv["debug"] && useLogging) {
            consoleLog(fn, 'enums:', redundantEnums);
            consoleLog(fn, 'allOfs:', allOfs);
        }
        var optimized = null;
        if (argv["optimizeEnums"]) {
            consoleLog('optimize enums ...');
            optimized = optimize_enums_1.optimizeEnums(schema, redundantEnums);
        }
        if (argv["removeAllOfs"]) {
            consoleLog('remove allOf ...');
            optimized = remove_allofs_1.removeAllOfs(optimized || schema, allOfs, argv);
        }
        if (null != optimized) {
            if (argv['writeOutput']) {
                var optfn = fn.replace(/\.json/, '.opt.json');
                fs.writeFileSync(optfn, JSON.stringify(optimized, null, 2), { encoding: 'utf-8' });
                consoleLog("wrote " + optfn + ".");
            }
            if (argv['printOutput']) {
                console.log(JSON.stringify(optimized, null, 2));
            }
        }
    });
}
function fetchFile(x) {
    return Promise.resolve(x).then(function (x) {
        consoleLog("reading ", x, process.cwd(), fs.existsSync(x));
        return fs.readFileSync(x, 'utf-8');
    });
}
