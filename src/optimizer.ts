#! /usr/bin/env node

import * as fs from 'fs';
import * as mm from 'minimist';
import * as jsonref from  '@hn3000/json-ref';

import { IFilterStep } from './filter-step';

import filterTaggedStep from './filter-tagged';
import removeAllOfsStep from './remove-allofs';

const dynamicSteps: { [k:string]: IFilterStep }  = {
  'filter-tagged': filterTaggedStep,
  'remove-allofs': removeAllOfsStep
};

//console.log(process.argv);
var proc = new jsonref.JsonReferenceProcessor(fetchFile);
var jp = jsonref.JsonPointer;

import { findEnums, optimizeEnums, filterEnums } from './optimize-enums';
import { findAllOfs, removeAllOfs } from './remove-allofs';

var argv = mm(process.argv.slice(2));

var useLogging = !argv.printOutput;
consoleLog(argv);
const mainPromise = main(argv);

mainPromise.then(
  () => consoleLog('done.'),
  (x) => console.error('error in main', x)
);


function consoleLog(msg, ...args) {
  useLogging && console.log(msg, ...args);
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

  let optimized = schema;

  if (argv["optimizeEnums"]) {
    consoleLog('optimize enums ...');
    optimized = optimizeEnums(optimized, redundantEnums);
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
    if (argv['writeOutput']) {
      let optfn = fn.replace(/\.json/, '.opt.json');
      fs.writeFileSync(optfn, JSON.stringify(optimized, null, 2), { encoding: 'utf-8' });
      consoleLog(`wrote ${optfn}.`);
    }
    if (argv['printOutput']) {
      console.log(JSON.stringify(optimized, null, 2));
    }
  } else if (argv['printOutput'] || argv['writeOutput']) {
    console.error(`optimizer returned ${JSON.stringify(optimized)}`);
  }
}


function fetchFile(x) {
  return Promise.resolve(x).then(x => {
    consoleLog("reading ", x, process.cwd(), fs.existsSync(x));
    return fs.readFileSync(x, 'utf-8');
  });
}

