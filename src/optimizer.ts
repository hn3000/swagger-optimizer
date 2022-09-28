#! /usr/bin/env node

import * as fs from 'fs';
import * as mm from 'minimist';
import * as jsonref from  '@hn3000/json-ref';

import { findVersion, OpenAPIVersion } from './openapi-version';
import { IFilterStep } from './filter-step';

import filterTaggedStep from './filter-tagged';
import removeAllOfsStep from './remove-allofs';

const dynamicSteps: { [k:string]: IFilterStep }  = {
  'filter-tagged': filterTaggedStep,
  'remove-allofs': removeAllOfsStep
};

//console.log(process.argv);
var proc = new jsonref.JsonReferenceProcessor(fetchFile);

import { findEnums, optimizeEnums, filterEnums } from './optimize-enums';
import { findAllOfs, removeAllOfs } from './remove-allofs';
import { capitalize } from './util';

var argv = mm(process.argv.slice(2));

var useLogging = !argv.printOutput;
var useDebug = !argv.debug;
debugLog(argv);

const mainPromise = (argv.help || argv._.length == 0) ? help() : main(argv);

mainPromise.then(
  () => consoleLog('done.'),
  (x) => console.error('error in main', x)
);


function consoleLog(msg, ...args) {
  useLogging && console.log(msg, ...args);
}
function debugLog(msg, ...args) {
  useDebug && console.log(msg, ...args);
}

async function help() {
  const helpText = `usage: ${process.argv[1]} [options] <api-definition.json>
options:
  --help                  print this text
  --deref=true            dereference all instances of $ref found in the file
  --optimizeEnums=true    run the enum optimization
  --rename={"oldName": "newName", ...}
                          rename enums
  --optimizeNumericEnums  also consider purely numeric enums for optimization
  --removeAllOfs=true     replace allOf by copying all attributes
  --step=x                additional steps to run:
  --step=filter-tagged({"in":['some-tag']})
  --step=filter-tagged({"notin":['other-tag']})
                          filter operations by tag -- "in" requires tag
  --step=remove-allofs    just like --removeAllOfs=true
  --printOutput=true      print the optimized JSON on the console
  --writeOutput=true      write the optimized JSON for $file.json to $file.opt.json
  --debug=true            print some debug info
`;

  console.log(helpText);
}

async function main(argv: any) {
  let stepsArg = (argv['step'] || []) as string[];
  if (typeof stepsArg == 'string') {
    stepsArg = [ stepsArg ];
  }

  let filterSteps: [IFilterStep, any][]  = stepsArg.map(x => {
    let name = x;
    let args = {} as any;
    if ("'" === x.charAt(0) && "'" === x.charAt(x.length-1)) {
      x = x.substring(1, x.length-1);
    }
    const openPos = x.indexOf('(');
    const closePos = x.lastIndexOf(')');
    if (-1 != openPos && ((x.length - 1) === closePos)) {
      name = x.substring(0, openPos);
      args = JSON.parse(x.substring(openPos + 1, closePos));
      args = proc._expandDynamic(args, ''); // process $ref
    }
    if (null == dynamicSteps[name]) {
      console.warn(`unknown step ${name}`);
    }
    return [ dynamicSteps[name], args ] as [IFilterStep, any];
  }).filter(x => null != x[0]);

  for (var i = 0, n = argv._.length; i < n; ++i) {
    var fn = argv._[i];
    var sp;
    if (argv['deref']) {
      sp = proc.expandRef(fn);
    } else {
      sp = fetchFile(fn).then(x => JSON.parse(x));
    }

    try {
      const schema = await sp;

      optimizeSchema(schema, fn, filterSteps);

    } catch (x) {
      console.error(x)
    }

  }
}

async function optimizeSchema(schema, fn, filterSteps: [ IFilterStep, any ][]) {
  const version = findVersion(schema);
  consoleLog(`optimizing ${version.name} ${fn}`, Object.keys(schema));

  let enums = findEnums(schema, fn);
  let redundantEnums = filterEnums(enums, argv);
  let allOfs = findAllOfs(schema);
  
  if (null != argv['rename']) {
    let nameMap = JSON.parse(argv['rename']);
    const otherNames = [];
    const foundNames = [];
    const unusedNames = Object.keys(nameMap);
    for (let e of redundantEnums) {
      const name = capitalize(e.name);
      if (null != nameMap[name]) {
        let newName = nameMap[name];
        e.name = newName;
        foundNames.push(name);
        const index = unusedNames.findIndex(x => x === name);
        if (-1 != index) {
          unusedNames.splice(index, 1);
        }
      } else {
        otherNames.push(name);
      }
    }
    if (argv["debug"] && useLogging && unusedNames.length) {
      consoleLog(`  unused rename entries: ${unusedNames.join(', ')}}`);
      consoleLog(`  found rename entries: ${foundNames.join(', ')}}`);
      consoleLog(`  other enum entries: ${otherNames.join(', ')}}`);
    }
  }

  if (argv["debug"] && useLogging) {
    //consoleLog(fn, 'enums:', JSON.stringify(redundantEnums, (x: any) => ((x instanceof jsonref.JsonReference) ? x.toString() : x), 4));
    debugLog(fn, 'enums:', redundantEnums, JSON.stringify(redundantEnums, null, 4));
    debugLog(fn, 'allOfs:', allOfs);
  }

  let optimized = schema;

  if (argv["optimizeEnums"]) {
    consoleLog('optimize enums ...');
    optimized = optimizeEnums(optimized, redundantEnums, version);
  }

  if (argv["removeAllOfs"]) {
    consoleLog('remove allOf ...');
    optimized = removeAllOfs(optimized, allOfs, argv);
  }

  for (let i = 0, n = filterSteps.length; i < n; ++i) {
    const step = filterSteps[i];

    await proc.fetchRef(fn);
    let options = proc.expandDynamic(step[1], fn);

    optimized = step[0](optimized, options);
  }

  if (null != optimized) {
    const writeOutput = argv['writeOutput'];
    if (writeOutput) {
      const isString = typeof writeOutput === 'string' && writeOutput !== 'true';
      let outputFilename = (isString) ? writeOutput : fn.replace(/\.json/, '.opt.json');
      fs.writeFileSync(outputFilename, JSON.stringify(optimized, null, 2), { encoding: 'utf-8' });
      consoleLog(`wrote ${outputFilename}.`);
    }
    if (argv['printOutput']) {
      console.log(JSON.stringify(optimized, null, 2));
    }
    if (!argv['writeOutput'] && !argv['printOutput']) {
      console.log(`optimized successfully, not printing result, need --printOutput=true or --writeOutput=true option`);
    }
  } else {
    if (argv['printOutput'] || argv['writeOutput']) {
      console.error(`optimizer returned ${JSON.stringify(optimized)}`);
    } else {
      console.error(`optimization failed`);
    }
  }
}


function fetchFile(x) {
  return Promise.resolve(x).then(x => {
    consoleLog("reading ", x, process.cwd(), fs.existsSync(x));
    return fs.readFileSync(x, 'utf-8');
  });
}

