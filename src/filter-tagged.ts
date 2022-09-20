
import { JsonPointer } from '@hn3000/json-ref';
import { IFilterStep } from './filter-step';

let filterStep:IFilterStep = (schema: any, options: any) => {
  let ops = findOperations(schema, options);
  if (null != ops && ops.length) {
    console.error(`removing ${ops.length} operations based on tags`);
    let result = removeOperations(schema, ops, options);
    return result;
  } else {
    console.error('not removing any operations');
  }
  return schema;
};

export default filterStep;

export interface IFilterTaggedOptions {
  in: string[];
  notin: string[];
  tagProp: string;
}


function taggedOperationMatcher(tagProp: string, inTags: string[], notinTags: string[]): (operation: any, p: JsonPointer) => boolean {
  const tagName = tagProp || 'tags';
  return (operation: any, p: JsonPointer) => {
    if (p.keys.length != 3 || p.keys[0] !== 'paths') {
      return false;
    }

    let result = true;

    if (null != operation && null != operation[tagName]) {
      let tags: string | string[] = operation[tagName];
      if (typeof tags === 'string') {
        tags = [tags];
      }
      result = null != inTags;
      if (result) {
        result = inTags.every(x => -1 === tags.indexOf(x));
      }
      if (!result && null != notinTags) {
        result = notinTags.some(x => -1 !== tags.indexOf(x));
      }

    }
    return result;
  }
}

export function findOperations(
  schema: any,
  options: IFilterTaggedOptions
) {
  let pointers = [] as JsonPointer[];

  if (options.in || options.notin) {
    pointers = JsonPointer.pointers(schema, taggedOperationMatcher(options.tagProp, options.in, options.notin));
  }

  return pointers;
}


export function removeOperations(
  schema: any,
  operations: JsonPointer[],
  options:any
): any {
  let result = JSON.parse(JSON.stringify(schema));

  operations.forEach(p => {
    p.deleteValue(result);
    let pathObj = p.parent.getValue(result);
    if (Object.keys(pathObj).length === 0) {
      p.parent.deleteValue(result);
    }
  });

  return result;
}
