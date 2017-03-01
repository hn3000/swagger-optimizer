#! /usr/bin/env node

//console.log(process.argv);
var fs = require('fs');
var mm = require('minimist');
var jsonref = require('@hn3000/json-ref');
var proc = new jsonref.JsonReferenceProcessor(fetchFile);
var jp = jsonref.JsonPointer;

import { findEnums, optimizeEnums, filterEnums } from './optimize-enums'; 
import { findAllOfs, removeAllOfs } from './remove-allofs';

var argv = mm(process.argv.slice(2));

var useLogging = !argv.printOutput;

function consoleLog(msg, ...args) {
  useLogging && console.log(msg, ...args);
}

consoleLog(argv);

for (var i = 0, n = argv._.length; i < n; ++i) {
  var fn = argv._[i];
  var sp;
  if (argv['deref']) {
    sp = proc.expandRef(fn);
  } else {
    sp = fetchFile(fn).then(x => JSON.parse(x)); 
  }

  sp.then(schema => {

    consoleLog(`hunting for instances of enum and allOf in ${fn}`, Object.keys(schema));
    
    let enums = findEnums(schema, fn);
    let redundantEnums = filterEnums(enums, argv);
    let allOfs = findAllOfs(schema);

    if (null != argv['rename']) {
      let nameMap = JSON.parse(argv['rename']);
      for (let e of redundantEnums) {
        if (null != nameMap[e.name]) {
          let newName = nameMap[e.name];
          e.name = newName;
        }
      }
    }

    if (argv["debug"] && useLogging) {
      consoleLog(fn, 'enums:', redundantEnums);
      consoleLog(fn, 'allOfs:', allOfs);
    }

    let optimized = null;

    if (argv["optimizeEnums"]) {
      consoleLog('optimize enums ...');
      optimized = optimizeEnums(schema, redundantEnums);
    }

    if (argv["removeAllOfs"]) {
      consoleLog('remove allOf ...');
      optimized = removeAllOfs(optimized || schema, allOfs, argv);
    }

    if (null != optimized) {
      if (argv['writeOutput']) {
        let optfn = fn.replace(/\.json/, '.opt.json');
        fs.writeFileSync(optfn, JSON.stringify(optimized,null,2), { encoding: 'utf-8'});
        consoleLog(`wrote ${optfn}.`);
      }
      if (argv['printOutput']) {
        console.log(JSON.stringify(optimized,null,2));
      }
    } else if (argv['printOutput'] || argv['writeOutput']) {
      console.error(`optimizer returned ${JSON.stringify(optimized)}`);
    }

  }).then(null, (x) => console.error(x));
}

function fetchFile(x) {
  return Promise.resolve(x).then(x => {
    consoleLog("reading ", x, process.cwd(), fs.existsSync(x));
    return fs.readFileSync(x, 'utf-8');
  });
}

