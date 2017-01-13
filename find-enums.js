#! /usr/bin/env node

//console.log(process.argv);
var fs = require('fs');
var mm = require('minimist');
var jsonref = require('@hn3000/json-ref');
var proc = new jsonref.JsonReferenceProcessor(fetchFile);
var jp = jsonref.JsonPointer;

var argv = mm(process.argv.slice(2));

for (var i = 0, n = argv._.length; i < n; ++i) {
  var fn = argv._[i];
  var sp = fetchFile(fn).then(x => JSON.parse(x)); // proc.expandRef(fn);

  sp.then(schema => {

    console.log(`hunting for enums in ${fn}`);
    let enums = findEnums(schema, fn);
    let redundantEnums = enums.filter(e => e.props.length > 1);

    if (null != argv['rename']) {
      let nameMap = JSON.parse(argv['rename']);
      for (let e of redundantEnums) {
        if (null != nameMap[e.name]) {
          let newName = nameMap[e.name];
          e.name = newName;
        }
      }
    }

    if ("true" === argv["debug"]) {
      console.log(fn, redundantEnums);
    }

    if ("false" !== argv["optimize"]) {
      let optimized = optimizeEnums(schema, redundantEnums);
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

function findEnums(schema, fn) {
  var defs = schema.definitions;
  var queue = [schema];
  var paths = [new jp("")];
  var enums = [];

  var count = 0;

  while (0 !== queue.length) {
    var thisOne = queue[0];
    var thisPath = paths[0];
    queue.splice(0, 1);
    paths.splice(0, 1);

    if (count % 100 == 99) {
      console.log(`examining ${thisPath}`);
    }
    ++count;

    var props = Object.keys(thisOne);
    for (var p of props) {
      if (thisOne[p]) {
        if (thisOne[p].enum != null) {
          let values = thisOne[p].enum;
          let name = p;
          if (name === 'items') {
            let segs = thisPath.segments;
            name = segs.pop();
          } else if (/^\d+$/.test(name)) {
            // skip parameters
            continue;
          }
          let prev = enums.filter(x => sameValuesAllowed(values, x.values));
          if (0 !== prev.length) {
            let entry = prev[0];
            entry.where.push(thisPath.toString());
            entry.paths.push(thisPath);
            entry.props.push(p);
            if (-1 === entry.names.indexOf(name)) {
              entry.names.push(name);
            }
          } else {
            enums.push({
              values: values,
              props: [p],
              names: [name],
              where: [ thisPath.toString() ],
              paths: [ thisPath ]
            });
          }
        } else if (p[0] != '$' && ('object' === typeof thisOne[p])) {
          queue.push(thisOne[p]);
          paths.push(thisPath.add(p));
        }
      }
    }
  }

  for (let e of enums) {
    e.name = e.names.reduce((a,b) => (a.length <= b.length ? a : b));
  }

  return enums;
}

function optimizeEnums(schema, enums) {
  let result = JSON.parse(JSON.stringify(schema));
  let defs = result.definitions;

  for (let e of enums) {
    let p = e.paths[0].add(e.props[0]);
    let t = p.getValue(result);
    let nname = `${e.name.substring(0,1).toUpperCase()}${e.name.substring(1)}`;
    defs[nname] = t;
    let ref = { "$ref": `#/definitions/${nname}` };

    for (let i=0,n=e.paths.length; i<n; ++i) {
      p = e.paths[i].add(e.props[i]);
      p.setValue(result, ref);
    }
  }

  return result;
}

function sameValuesAllowed(a, b) {
  return (
    a.length === b.length
    && a.every(xa => b.some(xb => xb === xa))
    && b.every(xb => a.some(xa => xb === xa))
  );
}
