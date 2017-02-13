#! /usr/bin/env node

//console.log(process.argv);
var fs = require('fs');
var mm = require('minimist');
var jsonref = require('@hn3000/json-ref');
var proc = new jsonref.JsonReferenceProcessor(fetchFile);
var jp = jsonref.JsonPointer;

var { findEnums, optimizeEnums, filterEnums } = require('./optimize-enums'); 
var { findAllOfs, removeAllOfs } = require('./remove-allofs'); 

var argv = mm(process.argv.slice(2));

console.log(argv);

for (var i = 0, n = argv._.length; i < n; ++i) {
  var fn = argv._[i];
  var sp;
  if (argv['deref']) {
    sp = proc.expandRef(fn);
  } else {
    sp = fetchFile(fn).then(x => JSON.parse(x)); 
  }

  sp.then(schema => {

    console.log(`hunting for instances of enum and allOf in ${fn}`, Object.keys(schema));
    
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

    if (argv["debug"]) {
      console.log(fn, 'enums:', redundantEnums);
      console.log(fn, 'allOfs:', allOfs);
    }

    let optimized = null;

    if (argv["optimizeEnums"]) {
      optimized = optimizeEnums(schema, redundantEnums);
    }

    if (argv["removeAllOfs"]) {
      optimized = removeAllOfs(optimized || schema, allOfs);
    }

    if (null != optimized) {
      let optfn = fn.replace(/\.json/, '.opt.json');
      fs.writeFileSync(optfn, JSON.stringify(optimized,null,2), { encoding: 'utf-8'});
      console.log(`wrote ${optfn}.`);
    }

  });

}

function fetchFile(x) {
  return Promise.resolve(x).then(x => {
    console.log("reading ", x, process.cwd(), fs.existsSync(x));
    return fs.readFileSync(x, 'utf-8');
  });
}

