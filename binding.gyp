{
  "targets": [
    {
      "target_name": "tree_sitter_sail_binding",
      "dependencies": [
        "<!(node -p \"require('node-addon-api').targets\"):node_addon_api_except",
      ],
      "include_dirs": [
        "grammars/sail/src",
      ],
      "sources": [
        "bindings/node/binding.cc",
        "grammars/sail/src/parser.c",
      ],
      "variables": {
        "has_scanner": "<!(node -p \"fs.existsSync('grammars/sail/src/scanner.c')\")"
      },
      "conditions": [
        ["has_scanner=='true'", {
          "sources+": ["grammars/sail/src/scanner.c"],
        }],
        ["OS!='win'", {
          "cflags_c": [
            "-std=c11",
          ],
        }, { # OS == "win"
          "cflags_c": [
            "/std:c11",
            "/utf-8",
          ],
        }],
      ],
    }
  ]
}
