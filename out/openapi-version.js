"use strict";
exports.__esModule = true;
exports.findVersion = void 0;
var json_ref_1 = require("@hn3000/json-ref");
function findVersion(schema) {
    var version = "0";
    if (schema.swagger) {
        version = schema.swagger;
    }
    if (schema.openapi) {
        version = schema.openapi;
    }
    if (version.startsWith("1.")) {
        return {
            name: "Swagger ".concat(version),
            definitionsPath: json_ref_1.JsonPointer.get('/definitions')
        };
    }
    else if (version === "2.") {
        return {
            name: "Swagger ".concat(version),
            definitionsPath: json_ref_1.JsonPointer.get('/definitions')
        };
    }
    else if (version.startsWith("3.")) {
        return {
            name: "OpenAPI ".concat(version),
            definitionsPath: json_ref_1.JsonPointer.get('/components/schemas')
        };
    }
    console.warn("encountered unknown OpenAPI version ".concat(version));
    return {
        name: "Unknown OpenAPI ".concat(version),
        definitionsPath: json_ref_1.JsonPointer.get('/definitions')
    };
}
exports.findVersion = findVersion;
//# sourceMappingURL=openapi-version.js.map