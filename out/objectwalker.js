"use strict";
exports.__esModule = true;
exports.walkObject = void 0;
var jsonref = require("@hn3000/json-ref");
var pointer = jsonref.JsonPointer;
function walkObject(object, walker, acc) {
    var queue = [object];
    var paths = [new pointer("")];
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
        for (var _i = 0, props_1 = props; _i < props_1.length; _i++) {
            var p = props_1[_i];
            var hereVal = thisOne[p];
            if (hereVal && (typeof hereVal === 'object')) {
                var herePath = thisPath.add(p);
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
exports.walkObject = walkObject;
//# sourceMappingURL=objectwalker.js.map