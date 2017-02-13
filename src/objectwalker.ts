
import * as jsonref from '@hn3000/json-ref';
var pointer = jsonref.JsonPointer;

export interface IWalker<R> {
  (val: any, path: jsonref.JsonPointer, r: R): boolean
}
export function walkObject<R>(object:any, walker: IWalker<R>, acc: R): R {
  var queue = [ object ];
  var paths = [new pointer("")];
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
      let hereVal = thisOne[p];
      if (hereVal && (typeof hereVal === 'object')) {
        let herePath = thisPath.add(p);
        if (!walker(hereVal, herePath, acc)) {
          queue.push(thisOne[p]);
          paths.push(herePath);
        }
//      } else {
//        console.log(`ignoring ${hereVal} @ ${thisPath}[${p}]`);
      }
    }
  }

  return acc;
}

