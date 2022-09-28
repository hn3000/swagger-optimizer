#! /usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
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
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
var fs = require("fs");
var mm = require("minimist");
var jsonref = require("@hn3000/json-ref");
var openapi_version_1 = require("./openapi-version");
var filter_tagged_1 = require("./filter-tagged");
var remove_allofs_1 = require("./remove-allofs");
var dynamicSteps = {
    'filter-tagged': filter_tagged_1["default"],
    'remove-allofs': remove_allofs_1["default"]
};
//console.log(process.argv);
var proc = new jsonref.JsonReferenceProcessor(fetchFile);
var optimize_enums_1 = require("./optimize-enums");
var remove_allofs_2 = require("./remove-allofs");
var util_1 = require("./util");
var argv = mm(process.argv.slice(2));
var useLogging = !argv.printOutput;
var useDebug = !argv.debug;
debugLog(argv);
var mainPromise = (argv.help || argv._.length == 0) ? help() : main(argv);
mainPromise.then(function () { return consoleLog('done.'); }, function (x) { return console.error('error in main', x); });
function consoleLog(msg) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    useLogging && console.log.apply(console, __spreadArray([msg], args, false));
}
function debugLog(msg) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    useDebug && console.log.apply(console, __spreadArray([msg], args, false));
}
function help() {
    return __awaiter(this, void 0, void 0, function () {
        var helpText;
        return __generator(this, function (_a) {
            helpText = "usage: ".concat(process.argv[1], " [options] <api-definition.json>\noptions:\n  --help                  print this text\n  --deref=true            dereference all instances of $ref found in the file\n  --optimizeEnums=true    run the enum optimization\n  --rename={\"oldName\": \"newName\", ...}\n                          rename enums\n  --optimizeNumericEnums  also consider purely numeric enums for optimization\n  --removeAllOfs=true     replace allOf by copying all attributes\n  --step=x                additional steps to run:\n  --step=filter-tagged({\"in\":['some-tag']})\n  --step=filter-tagged({\"notin\":['other-tag']})\n                          filter operations by tag -- \"in\" requires tag\n  --step=remove-allofs    just like --removeAllOfs=true\n  --printOutput=true      print the optimized JSON on the console\n  --writeOutput=true      write the optimized JSON for $file.json to $file.opt.json\n  --debug=true            print some debug info\n");
            console.log(helpText);
            return [2 /*return*/];
        });
    });
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
                            args = proc._expandDynamic(args, ''); // process $ref
                        }
                        if (null == dynamicSteps[name]) {
                            console.warn("unknown step ".concat(name));
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
        var version, enums, redundantEnums, allOfs, nameMap, otherNames, foundNames, unusedNames, _loop_1, _i, redundantEnums_1, e, optimized, i, n, step, options, writeOutput, isString, outputFilename;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    version = (0, openapi_version_1.findVersion)(schema);
                    consoleLog("optimizing ".concat(version.name, " ").concat(fn), Object.keys(schema));
                    enums = (0, optimize_enums_1.findEnums)(schema, fn);
                    redundantEnums = (0, optimize_enums_1.filterEnums)(enums, argv);
                    allOfs = (0, remove_allofs_2.findAllOfs)(schema);
                    if (null != argv['rename']) {
                        nameMap = JSON.parse(argv['rename']);
                        otherNames = [];
                        foundNames = [];
                        unusedNames = Object.keys(nameMap);
                        _loop_1 = function (e) {
                            var name = (0, util_1.capitalize)(e.name);
                            if (null != nameMap[name]) {
                                var newName = nameMap[name];
                                e.name = newName;
                                foundNames.push(name);
                                var index = unusedNames.findIndex(function (x) { return x === name; });
                                if (-1 != index) {
                                    unusedNames.splice(index, 1);
                                }
                            }
                            else {
                                otherNames.push(name);
                            }
                        };
                        for (_i = 0, redundantEnums_1 = redundantEnums; _i < redundantEnums_1.length; _i++) {
                            e = redundantEnums_1[_i];
                            _loop_1(e);
                        }
                        if (argv["debug"] && useLogging && unusedNames.length) {
                            consoleLog("  unused rename entries: ".concat(unusedNames.join(', '), "}"));
                            consoleLog("  found rename entries: ".concat(foundNames.join(', '), "}"));
                            consoleLog("  other enum entries: ".concat(otherNames.join(', '), "}"));
                        }
                    }
                    if (argv["debug"] && useLogging) {
                        //consoleLog(fn, 'enums:', JSON.stringify(redundantEnums, (x: any) => ((x instanceof jsonref.JsonReference) ? x.toString() : x), 4));
                        debugLog(fn, 'enums:', redundantEnums, JSON.stringify(redundantEnums, null, 4));
                        debugLog(fn, 'allOfs:', allOfs);
                    }
                    optimized = schema;
                    if (argv["optimizeEnums"]) {
                        consoleLog('optimize enums ...');
                        optimized = (0, optimize_enums_1.optimizeEnums)(optimized, redundantEnums, version);
                    }
                    if (argv["removeAllOfs"]) {
                        consoleLog('remove allOf ...');
                        optimized = (0, remove_allofs_2.removeAllOfs)(optimized, allOfs, argv);
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
                        writeOutput = argv['writeOutput'];
                        if (writeOutput) {
                            isString = typeof writeOutput === 'string' && writeOutput !== 'true';
                            outputFilename = (isString) ? writeOutput : fn.replace(/\.json/, '.opt.json');
                            fs.writeFileSync(outputFilename, JSON.stringify(optimized, null, 2), { encoding: 'utf-8' });
                            consoleLog("wrote ".concat(outputFilename, "."));
                        }
                        if (argv['printOutput']) {
                            console.log(JSON.stringify(optimized, null, 2));
                        }
                        if (!argv['writeOutput'] && !argv['printOutput']) {
                            console.log("optimized successfully, not printing result, need --printOutput=true or --writeOutput=true option");
                        }
                    }
                    else {
                        if (argv['printOutput'] || argv['writeOutput']) {
                            console.error("optimizer returned ".concat(JSON.stringify(optimized)));
                        }
                        else {
                            console.error("optimization failed");
                        }
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