; Keywords
[
  "as"
  "by"
  "catch"
  "clause"
  "config"
  "constant"
  "constraint"
  "dec"
  "default"
  "do"
  "else"
  "end"
  "foreach"
  "forall"
  "function"
  "if"
  "impure"
  "in"
  "inc"
  "instantiation"
  "let"
  "match"
  "overload"
  "pure"
  "ref"
  "register"
  "repeat"
  "return"
  "scattered"
  "sizeof"
  "termination_measure"
  "then"
  "throw"
  "try"
  "until"
  "val"
  "var"
  "while"
  "with"
  "when"
] @keyword

; Control flow keywords
[
  "if"
  "then"
  "else"
  "match"
  "try"
  "catch"
  "throw"
  "return"
  "foreach"
  "while"
  "do"
  "repeat"
  "until"
] @keyword.control

; Type keywords
[
  "type"
  "struct"
  "enum"
  "union"
  "bitfield"
  "mapping"
] @keyword.type

; Storage modifiers
[
  "Private"
] @storageclass

; Operators
[
  "->"
  "<->"
  "=>"
  "="
  "::"
  ":"
  ".."
  "."
  ","
  ";"
  "@"
  "^"
  "|"
  "-"
  "*"
  "and"
  "or"
  "not"
  "xor"
  "in"
] @operator

; General operators (captured by the operator token)
(operator) @operator

; Brackets
[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
  "[|"
  "|]"
] @punctuation.bracket

; Delimiters
[
  ","
  ";"
  ":"
] @punctuation.delimiter

; Literals
(lit) @constant

; Boolean literals
[
  "true"
  "false"
] @boolean

; Special literals
[
  "undefined"
  "bitzero"
  "bitone"
] @constant.builtin

; Unit literal
"()" @constant.builtin

; Numbers
(number) @number
(hexadecimal_literal) @number
(binary_literal) @number

; Strings
(string_literal) @string

; Comments
(comment) @comment

; Attributes
(attribute
  name: (identifier) @attribute)

; Line directives
(line_directive
  directive: (line_directive_name) @preproc)

; Type variables
(type_variable) @type.parameter

; Type names in type definitions
(type_def
  (id) @type.definition)

(struct_field
  (id) @property)

; Function definitions
(fun_def
  (funcls
    (id) @function))

(funcl
  (id) @function)

; Function calls
(atomic_exp
  (id) @function.call
  "(")

; Method calls
(atomic_exp
  (atomic_exp)
  "."
  (id) @method.call
  "(")

; Property access
(atomic_exp
  (atomic_exp)
  "."
  (id) @property)

; Type annotations
(atomic_typ
  (id) @type)

(typ_var) @type.parameter

; Pattern matching - patterns can contain identifiers

; Identifiers (fallback)
(id) @variable

; Built-in kinds
[
  "Int"
  "Nat"
  "Type"
  "Order"
  "Bool"
] @type.builtin

; Pure keyword
"pure" @attribute

; Mapping clauses
[
  "forwards"
  "backwards"
] @keyword

; Fixity declarations
[
  "infix"
  "infixl"
  "infixr"
] @keyword

; Special operators as identifiers
(id
  "operator" @keyword
  (operator) @operator)

; Field names in expressions and patterns
; These are captured by the general (id) rule

; Enum variants
(enum_comma
  (id) @constant)

; Union cases
(type_union
  (id) @constant)

; Extern bindings
(extern_binding
  (id) @function
  ":"
  (string_literal) @string)

; Val specifications
(val_spec_def
  "val"
  (id)? @function
  (string_literal)? @string)

; Register names
(register_def
  "register"
  (id) @variable.special)

; Overload function names
(overload_def
  "overload"
  (id) @function)
