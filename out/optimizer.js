#! /usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var fs = require("fs");
var mm = require("minimist");
var jsonref = require("@hn3000/json-ref");
var filter_tagged_1 = require("./filter-tagged");
var remove_allofs_1 = require("./remove-allofs");
var dynamicSteps = {
    'filter-tagged': filter_tagged_1["default"],
    'remove-allofs': remove_allofs_1["default"]
};
//console.log(process.argv);
var proc = new jsonref.JsonReferenceProcessor(fetchFile);
var jp = jsonref.JsonPointer;
var optimize_enums_1 = require("./optimize-enums");
var remove_allofs_2 = require("./remove-allofs");
var argv = mm(process.argv.slice(2));
var useLogging = !argv.printOutput;
consoleLog(argv);
var mainPromise = main(argv);
mainPromise.then(function () { return consoleLog('done.'); }, function (x) { return console.error('error in main', x); });
function consoleLog(msg) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    useLogging && console.log.apply(console, [msg].concat(args));
}
function main(argv) {
    return __awaiter(this, void 0, void 0, function () {
        var stepsArg, filterSteps, i, n, fn, sp, schema, x_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    stepsArg = (argv['step'] || []);
                    if (typeof stepsArg == 'string') {
                        stepsArg = [stepsArg];
                    }
                    filterSteps = stepsArg.map(function (x) {
                        var name = x;
                        var args = {};
                        if ("'" === x.charAt(0) && "'" === x.charAt(x.length - 1)) {
                            x = x.substring(1, x.length - 1);
                        }
                        var openPos = x.indexOf('(');
                        var closePos = x.lastIndexOf(')');
                        if (-1 != openPos && ((x.length - 1) === closePos)) {
                            name = x.substring(0, openPos);
                            args = JSON.parse(x.substring(openPos + 1, closePos));
                        }
                        if (null == dynamicSteps[name]) {
                            console.warn("unknown step " + name);
                        }
                        return [dynamicSteps[name], args];
                    }).filter(function (x) { return null != x[0]; });
                    i = 0, n = argv._.length;
                    _a.label = 1;
                case 1:
                    if (!(i < n)) return [3 /*break*/, 6];
                    fn = argv._[i];
                    if (argv['deref']) {
                        sp = proc.expandRef(fn);
                    }
                    else {
                        sp = fetchFile(fn).then(function (x) { return JSON.parse(x); });
                    }
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, sp];
                case 3:
                    schema = _a.sent();
                    optimizeSchema(schema, fn, filterSteps);
                    return [3 /*break*/, 5];
                case 4:
                    x_1 = _a.sent();
                    console.error(x_1);
                    return [3 /*break*/, 5];
                case 5:
                    ++i;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function optimizeSchema(schema, fn, filterSteps) {
    return __awaiter(this, void 0, void 0, function () {
        var enums, redundantEnums, allOfs, nameMap, _i, redundantEnums_1, e, newName, optimized, i, n, step, options, optfn;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    consoleLog("hunting for instances of enum and allOf in " + fn, Object.keys(schema));
                    enums = optimize_enums_1.findEnums(schema, fn);
                    redundantEnums = optimize_enums_1.filterEnums(enums, argv);
                    allOfs = remove_allofs_2.findAllOfs(schema);
                    if (null != argv['rename']) {
                        nameMap = JSON.parse(argv['rename']);
                        for (_i = 0, redundantEnums_1 = redundantEnums; _i < redundantEnums_1.length; _i++) {
                            e = redundantEnums_1[_i];
                            if (null != nameMap[e.name]) {
                                newName = nameMap[e.name];
                                e.name = newName;
                            }
                        }
                    }
                    if (argv["debug"] && useLogging) {
                        consoleLog(fn, 'enums:', redundantEnums);
                        consoleLog(fn, 'allOfs:', allOfs);
                    }
                    optimized = schema;
                    if (argv["optimizeEnums"]) {
                        consoleLog('optimize enums ...');
                        optimized = optimize_enums_1.optimizeEnums(optimized, redundantEnums);
                    }
                    if (argv["removeAllOfs"]) {
                        consoleLog('remove allOf ...');
                        optimized = remove_allofs_2.removeAllOfs(optimized, allOfs, argv);
                    }
                    i = 0, n = filterSteps.length;
                    _a.label = 1;
                case 1:
                    if (!(i < n)) return [3 /*break*/, 4];
                    step = filterSteps[i];
                    return [4 /*yield*/, proc.fetchRef(fn)];
                case 2:
                    _a.sent();
                    options = proc.expandDynamic(step[1], fn);
                    optimized = step[0](optimized, options);
                    _a.label = 3;
                case 3:
                    ++i;
                    return [3 /*break*/, 1];
                case 4:
                    if (null != optimized) {
                        if (argv['writeOutput']) {
                            optfn = fn.replace(/\.json/, '.opt.json');
                            fs.writeFileSync(optfn, JSON.stringify(optimized, null, 2), { encoding: 'utf-8' });
                            consoleLog("wrote " + optfn + ".");
                        }
                        if (argv['printOutput']) {
                            console.log(JSON.stringify(optimized, null, 2));
                        }
                    }
                    else if (argv['printOutput'] || argv['writeOutput']) {
                        console.error("optimizer returned " + JSON.stringify(optimized));
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function fetchFile(x) {
    return Promise.resolve(x).then(function (x) {
        consoleLog("reading ", x, process.cwd(), fs.existsSync(x));
        return fs.readFileSync(x, 'utf-8');
    });
}
//# sourceMappingURL=optimizer.js.map