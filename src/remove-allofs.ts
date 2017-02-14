
import { walkObject } from './objectwalker';
import { JsonPointer } from '@hn3000/json-ref';


export function findAllOfs(schema: any): JsonPointer[] {
  return walkObject(schema, collectAllOf, []);
}

function collectAllOf(hereVal: any, herePath: JsonPointer, acc: JsonPointer[]) {
  //console.log(herePath.toString(), herePath.get(-1));
  if (null != hereVal && (herePath.get(-1) === 'allOf')) {
    acc.push(herePath);
  }
  return false;
}

export interface IRemoveAllOfOptions {
  sortedObjects?: any;
  [o:string]:any;
}

export function removeAllOfs(schema, allOfs: JsonPointer[], options: IRemoveAllOfOptions) {
  let result = JSON.parse(JSON.stringify(schema));
  let defs = result.definitions;

  for (let a of allOfs) {
    let p = a.parent;
    let target = p.getValue(result);

    let allOf = a.getValue(result);
    a.deleteValue(result);
    mergeSchemas(target, allOf, p, options);
  }

  return result;
}

function mergeSchemas(target: any, sources: any[], path: JsonPointer, options:IRemoveAllOfOptions) {
  for (let s of sources) {
    mergeIntoSchema(target, s, path, options);
  }
  return target;
}

function mergeIntoSchema(target: any, source: any, path: JsonPointer, options:IRemoveAllOfOptions) {

//console.log("merging", source, "into", target);

  if (null != target.type && null != source.type && target.type !== source.type) {
    console.warn(`different types for ${path.toString()}: ${target.type} !== ${source.type}`);
  } else if (null == target.type) {
    target.type = source.type;
  }

  let targetEnum = mergeEnumValues(target.enum, source.enum, options.sortedObjects);
  if (null != target.enum && target.enum.length != 0 && targetEnum.length == 0 && null != source.enum) {
    console.warn(`intersection of enums is empty @${path.toString()}: [${targetEnum.join(',')}] / [${source.enum.join(',')}]`);
  }
  if (null != targetEnum) {
    target.enum = targetEnum;
  } else {
    delete target.enum;
  }
  if (target.required && source.required) {
    target.required = arrayUnion(source.required, target.required, options.sortedObjects);
  } else if (null == target.required) {
    target.required = source.required;
  }
  if (target.properties && source.properties) {
    target.properties = mergeProperties(source.properties, target.properties, path, options);
  } else if (null == target.properties) {
    target.properties = source.properties;
  }
}

function mergeProperties(propsA: any, propsB: any, path: JsonPointer, options: IRemoveAllOfOptions) {
  let result = { };
  for (let k of Object.keys(propsA)) {
    result[k] = propsA[k];
  }
  for (let k of Object.keys(propsB)) {
    if (null != propsA[k] && null != propsB[k]) {
      result[k] = mergeSchemas({}, [propsA[k], propsB[k]], path.add(k), options);
    } else if (null == result[k]) {
      result[k] = propsB[k];
    }
  }

  if (options.sortedObjects) {
    let keys = Object.keys(result);
    keys.sort();
    let tmp = {};
    for (let k of keys) {
      tmp[k] = result[k];
    }
    result = tmp;
  }

  return result;
}

function mergeEnumValues(a: string[], b: string[], sort: boolean) {
  if (null == a) return b;
  if (null == b) return a;

  return arrayIntersection(a,b, sort);
}

function arrayUnion(a: string[], b: string[], sort: boolean) {
  return _arrayUnionOrIntersection(a,b, false, sort);
}
function arrayIntersection(a: string[], b: string[], sort: boolean) {
  return _arrayUnionOrIntersection(a,b, true, sort);
}

function _arrayUnionOrIntersection(a,b,intersect:boolean, sort: boolean) {
  let tmp = {};
  for (let k of a) {
    tmp[k] = 1;
  }
  for (let k of b) {
    tmp[k] = (tmp[k] || 0) + 1;
  }
  let result = Object.keys(tmp);
  if (intersect) {
    result = result.filter(k => (tmp[k] === 2));
  }
  if (sort) {
    result.sort();
  }
  return result;
}
