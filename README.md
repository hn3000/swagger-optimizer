
# swagger-optimizer

A tool to perform transformations on (non-conforming) swagger files so that the standard swagger tooling can be used on them.

The transformations supported are:

- enum unification
  finds identical enums and turns them into $ref to a common definition

- remove allOf
  removes allOf and merges the referenced definitions into the one containing the allOf


## Examples

### enum Unification

The following definition with a redundant enum:

    {
      "type": "object",
      "properties": {
        "something": { "type": "string", "enum": [ "a", "b", "c" ] },
        "somethingElse": { "type": "string", "enum": [ "a", "b", "c" ] }
      }
    }

gets turned into one with a common enum named after the shortest property it's used in:

    {
      "type": "object",
      "properties": {
        "something": { "$ref": "#/definitions/SomethingEnum" },
        "somethingElse": { "$ref": "#/definitions/SomethingEnum" }
      },
      "definitions": {
        "SomethingEnum": { "type": "string", "enum": [ "a", "b", "c" ] }
      }
    }


### allOf Removal


    {
      "type": "object",
      "properties": {
        "something": {
          "type": "string"
        }
      },

      "allOf": [
        {
          "properties": {
            "something": {
              "enum": [ "a", "b", "c" ]
            },
            "somethingElse": {
              "type": "string",
              "enum": [ "a", "b", "c" ]
            }
          }
        },
        {
          "require": [
            "something",
            "somethingElse"
          ]
        }
      ]
    }
-->

    {
      "type": "object",
      "properties": {
        "something": { "type": "string", "enum": [ "a", "b", "c" ] },
        "somethingElse": { "type": "string", "enum": [ "a", "b", "c" ] }
      },
      "require": [ "something", "somethingElse" ]
    }


