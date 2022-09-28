
import { JsonPointer } from '@hn3000/json-ref';
import { OpenAPIVersion } from './openapi-version';

export function findEnums(schema, fn) {
  var queue = [schema];
  var paths: JsonPointer[] = [new JsonPointer("")];
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
    for (var p of props) {
      if (thisOne[p]) {
        if (thisOne[p].enum != null) {
          let values = thisOne[p].enum;
          let name = p;
          if (name === 'items') {
            let segs = thisPath.keys.slice();
            name = segs.pop();
          } else if (name === 'type') {
            let segs = thisPath.keys.slice();
            if (segs[segs.length-1] == 'properties') {
              segs.pop();
            }
            name = segs.pop()+'Type';
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
              name: name,
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

function sameEnum(a, b) {
  return a.type === b.type && a.enum && b.enum && sameValuesAllowed(a.enum, b.enum);
}

export function optimizeEnums(schema, enums, version: OpenAPIVersion) {
  let result = JSON.parse(JSON.stringify(schema));
  let defs = version.definitionsPath.getValue(result);
  let defsPath = version.definitionsPath.asString();

  if (undefined == defs) {
    console.warn(`  no definitions found at ${version.definitionsPath.toString()}`);
  }

  for (let e of enums) {
    let p = e.paths[0].add(e.props[0]);
    let t = p.getValue(result);
    let nname = `${e.name.substring(0,1).toUpperCase()}${e.name.substring(1)}`;
    if (defs[nname] && !sameEnum(defs[nname], t)) {
      console.warn(`  possibly overwriting definition for ${nname}`, defs[nname], t);
    }
    if (!t.title) {
      let title = nname;
      if (!title.endsWith('Enum')) {
        title+='Enum';
      }
      t.title = title;
    }

    defs[nname] = t;
    const myPath = `${defsPath}/${nname}`;
    const ref = { "$ref": `#${myPath}` };

    for (let i=0,n=e.paths.length; i<n; ++i) {
      p = e.paths[i].add(e.props[i]);
      if (p.asString() !== myPath) {
        p.setValue(result, ref);
      }
    }
  }

  return result;
}

function sameValuesAllowed(a: string[], b: string[]) {
  return (
    a.length === b.length
    && a.every(xa => b.some(xb => xb === xa))
    && b.every(xb => a.some(xa => xb === xa))
  );
}

export function filterEnums(enums, argv:any) {
  let redundantEnums = enums.filter(e => (e.props.length >= 1 && e.values.length > 1));

  if (argv['optimizeNumericEnums']) {
    redundantEnums = redundantEnums.filter(e => (e.values.every(x => (typeof x === 'number'))));
  }
  if (argv['optimizeSimpleEnums']) {
    redundantEnums = redundantEnums.filter(e => (e.values.every(x => (typeof x === 'number'))));
  }

  return redundantEnums;
}
