# tree-sitter-sail

Tree-sitter grammar for the Sail instruction-set semantics specification language.

## Repository layout

- `grammar.js`: grammar definition (repo root, Tree-sitter standard layout)
- `src/parser.c`, `src/node-types.json`: generated parser artifacts
- `queries/`: editor queries (`highlights.scm`, `locals.scm`)
- `test/corpus/`: corpus tests for `tree-sitter test`
- `bindings/`: C/Go/Node/Python/Rust/Swift bindings

## Development

```sh
npm install
npm run generate
npm test
```

## Playground

```sh
npm run start
```
