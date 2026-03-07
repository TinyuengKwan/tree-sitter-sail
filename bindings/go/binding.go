package tree_sitter_sail

// #cgo CFLAGS: -I../../grammars/sail/src -std=c11 -fPIC
// #include "../../grammars/sail/src/parser.c"
// #if __has_include("../../grammars/sail/src/scanner.c")
// #include "../../grammars/sail/src/scanner.c"
// #endif
import "C"

import "unsafe"

// Get the tree-sitter Language for this grammar.
func Language() unsafe.Pointer {
	return unsafe.Pointer(C.tree_sitter_sail())
}
