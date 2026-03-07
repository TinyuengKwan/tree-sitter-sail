/**
 * @file Tree-sitter for the Sail instruction-set semantics specification language.
 * @author Gavin Zhao <me@gzgz.dev>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  COMMENT: -1,
  ATTRIBUTE: -1,
  PRIMARY: 10,
  POSTFIX: 9,
  PREFIX: 8,
  POWER: 7,
  MULTIPLY: 6,
  ADD: 5,
  SHIFT: 4,
  BITAND: 3,
  BITXOR: 2,
  BITOR: 1,
  COMPARE: 0,
  AND: -1,
  OR: -2,
  ASSIGN: -3,
  COMMA: -4,
};

module.exports = grammar({
  name: "sail",

  extras: $ => [
    /\s/,
    $.comment,
  ],

  conflicts: $ => [
    [$.typ, $.atomic_typ],
    [$.exp, $.atomic_exp],
    [$.pat, $.atomic_pat],
    [$.typ_var, $.atomic_typ],
    [$.prefix_typ_op, $.typ],
    [$.prefix_op, $.exp0],
    [$.struct_field, $.struct_fields],
    [$.type_union, $.type_unions],
    [$.fexp_exp, $.fexp_exp_list],
    [$.enum_comma],
    [$.attribute_data],
    [$.attribute_data_key_value],
    [$.typaram],
  ],

  word: $ => $.identifier,

  rules: {
    source_file: $ => repeat($.def),

    // Lexical tokens
    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_']*/,
    
    type_variable: $ => /'[a-zA-Z_][a-zA-Z0-9_']*/,
    
    operator: $ => choice(
      /[!%&*+\-\.\/:<?@\\^|~]+/,
      'and', 'or', 'not', 'xor',
    ),
    
    number: $ => /[0-9]+/,
    
    hexadecimal_literal: $ => /0x[0-9A-Fa-f_]+/,
    
    binary_literal: $ => /0b[01_]+/,
    
    string_literal: $ => choice(
      seq('"', repeat(choice(/[^"\\]/, /\\./)), '"'),
      seq("'", repeat(choice(/[^'\\]/, /\\./)), "'"),
    ),
    
    comment: $ => choice(
      seq('//', /.*/),
      seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/'),
    ),
    
    attribute: $ => seq(
      '$[',
      field('name', $.identifier),
      optional(seq(
        /\s+/,
        field('data', $.attribute_data),
      )),
      ']',
    ),
    
    line_directive: $ => seq(
      field('directive', $.line_directive_name),
      optional(seq(
        /[ \t]+/,
        field('argument', /[^\n]+/),
      )),
    ),

    line_directive_name: $ => token(seq('$', /[a-zA-Z_][a-zA-Z0-9_']*/)),
    
    attribute_data: $ => choice(
      seq('{', optional(seq($.attribute_data_key_value, repeat(seq(',', $.attribute_data_key_value)))), '}'),
      $.number,
      $.string_literal,
      $.identifier,
      'true',
      'false',
      seq('[', optional(seq($.attribute_data, repeat(seq(',', $.attribute_data)))), ']'),
    ),
    
    attribute_data_key_value: $ => seq(
      choice($.identifier, $.string_literal),
      '=',
      $.attribute_data,
    ),

    // Identifiers and operators
    id: $ => choice(
      $.identifier,
      seq('operator', choice($.operator, '-', '|', '^', '*')),
    ),
    
    op_no_caret: $ => choice(
      $.operator,
      '-', '|', '*', 'in',
    ),
    
    op: $ => choice(
      $.operator,
      '-', '|', '^', '*', 'in',
    ),
    
    exp_op: $ => choice(
      $.operator,
      '==', '!=', '<=', '>=',
      '-', '|', '@', '::', '^', '*',
    ),
    
    pat_op: $ => choice(
      '@', '::', '^',
    ),

    // Type variables
    typ_var: $ => $.type_variable,

    // Type arguments
    tyarg: $ => seq('(', $.typ_list, ')'),

    // Type operators
    prefix_typ_op: $ => choice(
      '2^',
      '-',
      '*',
    ),

    // Types
    postfix_typ: $ => $.atomic_typ,

    typ_no_caret: $ => prec.left(seq(
      optional($.prefix_typ_op),
      $.postfix_typ,
      repeat(seq($.op_no_caret, optional($.prefix_typ_op), $.postfix_typ)),
    )),

    typ: $ => choice(
      seq('if', field('condition', $.infix_typ), 'then', field('then', $.infix_typ), 'else', field('else', $.typ)),
      $.infix_typ,
    ),

    infix_typ: $ => prec.left(seq(
      optional($.prefix_typ_op),
      $.postfix_typ,
      repeat(seq($.op, optional($.prefix_typ_op), $.postfix_typ)),
    )),

    atomic_typ: $ => choice(
      $.id,
      '_',
      $.typ_var,
      $.lit,
      'dec',
      'inc',
      seq($.id, $.tyarg),
      seq('register', '(', $.typ, ')'),
      seq('(', $.typ, ')'),
      seq('(', $.typ, ',', $.typ_list, ')'),
      seq('{', $.number, repeat(seq(',', $.number)), '}'),
      seq('{', $.kopt, '.', $.typ, '}'),
      seq('{', $.kopt, ',', $.typ, '.', $.typ, '}'),
    ),

    typ_list: $ => choice(
      seq($.typ, optional(',')),
      seq($.typ, ',', $.typ_list),
    ),

    // Kinds
    kind: $ => choice(
      'Int',
      'Nat',
      'Type',
      'Order',
      'Bool',
    ),

    kopt: $ => choice(
      seq('(', 'constant', $.typ_var, ':', $.kind, ')'),
      seq('(', $.typ_var, ':', $.kind, ')'),
      $.typ_var,
    ),

    quantifier: $ => choice(
      seq($.kopt, ',', $.typ),
      $.kopt,
    ),

    // Effects
    effect: $ => $.id,

    effect_set: $ => choice(
      seq('{', $.effect, repeat(seq(',', $.effect)), '}'),
      'pure',
    ),

    // Type schemes
    typschm: $ => choice(
      seq($.typ, '->', $.typ),
      seq('forall', $.quantifier, '.', $.typ, '->', $.typ),
      seq($.typ, '<->', $.typ),
      seq('forall', $.quantifier, '.', $.typ, '<->', $.typ),
    ),

    // Patterns
    pat1: $ => prec.left(seq(
      $.atomic_pat,
      repeat(seq($.pat_op, $.atomic_pat)),
    )),

    pat: $ => choice(
      $.pat1,
      seq($.attribute, $.pat),
      seq($.pat1, 'as', $.typ),
    ),

    pat_list: $ => choice(
      seq($.pat, optional(',')),
      seq($.pat, ',', $.pat_list),
    ),

    atomic_pat: $ => choice(
      '_',
      $.lit,
      $.id,
      $.typ_var,
      seq($.id, '(', ')'),
      seq($.id, '[', $.number, ']'),
      seq($.id, '[', $.number, '..', $.number, ']'),
      seq($.id, '(', $.pat_list, ')'),
      seq($.atomic_pat, ':', $.typ_no_caret),
      seq('(', $.pat, ')'),
      seq('(', $.pat, ',', $.pat_list, ')'),
      seq('[', $.pat_list, ']'),
      seq('[|', '|]'),
      seq('[|', $.pat_list, '|]'),
      seq('struct', optional($.id), '{', $.fpat_list, '}'),
    ),

    fpat_list: $ => choice(
      seq($.fpat, optional(',')),
      seq($.fpat, ',', $.fpat_list),
    ),

    fpat: $ => choice(
      seq($.id, '=', $.pat),
      $.id,
      '_',
    ),

    // Literals
    lit: $ => choice(
      'true',
      'false',
      '()',
      $.number,
      'undefined',
      'bitzero',
      'bitone',
      $.binary_literal,
      $.hexadecimal_literal,
      $.string_literal,
    ),

    // Expressions
    exp: $ => choice(
      $.exp0,
      seq($.attribute, $.exp),
      prec.right(PREC.ASSIGN, seq($.exp0, '=', $.exp)),
      seq('let', $.letbind, 'in', $.exp),
      seq('var', $.atomic_exp, '=', $.exp, 'in', $.exp),
      seq('{', $.block, '}'),
      seq('return', $.exp),
      seq('throw', $.exp),
      prec.right(seq('if', $.exp, 'then', $.exp, 'else', $.exp)),
      prec.right(seq('if', $.exp, 'then', $.exp)),
      seq('match', $.exp, '{', $.case_list, '}'),
      seq('try', $.exp, 'catch', '{', $.case_list, '}'),
      seq('foreach', '(', $.id, $.identifier, $.atomic_exp, $.identifier, $.atomic_exp, 'by', $.atomic_exp, 'in', $.typ, ')', $.exp),
      seq('foreach', '(', $.id, $.identifier, $.atomic_exp, $.identifier, $.atomic_exp, 'by', $.atomic_exp, ')', $.exp),
      seq('foreach', '(', $.id, $.identifier, $.atomic_exp, $.identifier, $.atomic_exp, ')', $.exp),
      seq('repeat', optional(seq('termination_measure', '{', $.exp, '}')), $.exp, 'until', $.exp),
      seq('while', optional(seq('termination_measure', '{', $.exp, '}')), $.exp, 'do', $.exp),
    ),

    prefix_op: $ => choice(
      '2^',
      '-',
      '*',
    ),

    exp0: $ => prec.left(seq(
      optional($.prefix_op),
      $.atomic_exp,
      repeat(seq($.exp_op, optional($.prefix_op), $.atomic_exp)),
    )),

    case: $ => choice(
      seq($.pat, '=>', $.exp),
      seq($.pat, 'if', $.exp, '=>', $.exp),
      seq($.attribute, '(', $.case, ')'),
    ),

    case_list: $ => choice(
      $.case,
      seq($.case, ','),
      seq($.case, ',', $.case_list),
    ),

    block: $ => choice(
      seq($.exp, optional(';')),
      seq('let', $.letbind, optional(';')),
      seq('let', $.letbind, ';', $.block),
      seq('var', $.atomic_exp, '=', $.exp, optional(';')),
      seq('var', $.atomic_exp, '=', $.exp, ';', $.block),
      seq($.exp, ';', $.block),
    ),

    letbind: $ => seq($.pat, '=', $.exp),

    atomic_exp: $ => choice(
      seq($.atomic_exp, ':', $.atomic_typ),
      seq('config', $.identifier),
      $.lit,
      seq($.id, '->', $.id, '(', ')'),
      seq($.id, '->', $.id, '(', $.exp_list, ')'),
      seq($.atomic_exp, '.', $.id, '(', ')'),
      seq($.atomic_exp, '.', $.id, '(', $.exp_list, ')'),
      seq($.atomic_exp, '.', $.id),
      $.id,
      $.typ_var,
      seq('ref', $.id),
      seq($.id, '(', ')'),
      seq($.id, '(', $.exp_list, ')'),
      seq('sizeof', '(', $.typ, ')'),
      seq('constraint', '(', $.typ, ')'),
      seq($.atomic_exp, '[', $.exp, ']'),
      seq($.atomic_exp, '[', $.exp, '..', $.exp, ']'),
      seq($.atomic_exp, '[', $.exp, ',', $.exp, ']'),
      seq('struct', optional($.id), '{', $.fexp_exp_list, '}'),
      seq('{', $.exp, 'with', $.fexp_exp_list, '}'),
      seq('[', ']'),
      seq('[', $.exp_list, ']'),
      seq('[', $.exp, 'with', $.vector_update_list, ']'),
      seq('[|', '|]'),
      seq('[|', $.exp_list, '|]'),
      seq('(', $.exp, ')'),
      seq('(', $.exp, ',', $.exp_list, ')'),
    ),

    fexp_exp: $ => choice(
      seq($.atomic_exp, '=', $.exp),
      $.id,
    ),

    fexp_exp_list: $ => choice(
      $.fexp_exp,
      seq($.fexp_exp, ','),
      seq($.fexp_exp, ',', $.fexp_exp_list),
    ),

    exp_list: $ => choice(
      seq($.exp, optional(',')),
      seq($.exp, ',', $.exp_list),
    ),

    vector_update: $ => choice(
      seq($.atomic_exp, '=', $.exp),
      seq($.atomic_exp, '..', $.atomic_exp, '=', $.exp),
      $.id,
    ),

    vector_update_list: $ => choice(
      seq($.vector_update, optional(',')),
      seq($.vector_update, ',', $.vector_update_list),
    ),

    // Function annotations
    funcl_annotation: $ => choice(
      'Private',
      $.attribute,
    ),

    funcl_patexp: $ => choice(
      seq($.pat, '=', $.exp),
      seq('(', $.pat, 'if', $.exp, ')', '=', $.exp),
    ),

    funcl_patexp_typ: $ => choice(
      seq($.pat, '=', $.exp),
      seq($.pat, '->', $.typ, '=', $.exp),
      seq('forall', $.quantifier, '.', $.pat, '->', $.typ, '=', $.exp),
      seq('(', $.pat, 'if', $.exp, ')', '=', $.exp),
      seq('(', $.pat, 'if', $.exp, ')', '->', $.typ, '=', $.exp),
      seq('forall', $.quantifier, '.', '(', $.pat, 'if', $.exp, ')', '->', $.typ, '=', $.exp),
    ),

    funcl: $ => choice(
      seq($.funcl_annotation, $.id, $.funcl_patexp),
      seq($.id, $.funcl_patexp),
    ),

    funcls: $ => choice(
      seq($.funcl_annotation, $.id, $.funcl_patexp_typ),
      seq($.id, $.funcl_patexp_typ),
      seq($.funcl_annotation, $.id, $.funcl_patexp, 'and', $.funcl, repeat(seq('and', $.funcl))),
      seq($.id, $.funcl_patexp, 'and', $.funcl, repeat(seq('and', $.funcl))),
    ),

    funcl_typ: $ => choice(
      seq('forall', $.quantifier, '.', $.typ),
      $.typ,
    ),

    // Register definitions
    paren_index_range: $ => choice(
      seq('(', $.paren_index_range, '@', $.paren_index_range, repeat(seq('@', $.paren_index_range)), ')'),
      $.atomic_index_range,
    ),

    atomic_index_range: $ => choice(
      $.typ,
      seq($.typ, '..', $.typ),
      seq('(', $.typ, '..', $.typ, ')'),
    ),

    r_id_def: $ => seq($.id, ':', $.paren_index_range, repeat(seq('@', $.paren_index_range))),

    r_def_body: $ => choice(
      $.r_id_def,
      seq($.r_id_def, ','),
      seq($.r_id_def, ',', $.r_def_body),
    ),

    // Type parameters
    param_kopt: $ => choice(
      seq($.typ_var, ':', $.kind),
      $.typ_var,
    ),

    param_kopt_list: $ => choice(
      seq($.param_kopt, optional(',')),
      seq($.param_kopt, ',', $.param_kopt_list),
    ),

    typaram: $ => choice(
      seq('(', $.param_kopt_list, ')', ',', $.typ),
      seq('(', $.param_kopt_list, ')', 'constraint', $.typ),
      seq('(', $.param_kopt_list, ')'),
    ),

    // Type definitions
    type_def: $ => choice(
      seq('type', $.id, $.typaram, '=', $.typ),
      seq('type', $.id, '=', $.typ),
      seq('type', $.id, $.typaram, '->', $.kind, '=', $.typ),
      seq('type', $.id, ':', $.kind, '=', $.typ),
      seq('type', $.id, ':', $.kind, optional(seq('=', 'config', $.identifier, repeat(seq('.', $.identifier))))),
      seq('struct', $.id, '=', '{', $.struct_fields, '}'),
      seq('struct', $.id, $.typaram, '=', '{', $.struct_fields, '}'),
      seq('enum', $.id, '=', $.id, repeat(seq('|', $.id))),
      seq('enum', $.id, '=', '{', $.enum_comma, '}'),
      seq('enum', $.id, 'with', $.enum_functions, '=', '{', $.enum_comma, '}'),
      seq('union', $.id, '=', '{', $.type_unions, '}'),
      seq('union', $.id, $.typaram, '=', '{', $.type_unions, '}'),
      seq('bitfield', $.id, ':', $.typ, '=', '{', $.r_def_body, '}'),
    ),

    enum_functions: $ => choice(
      seq($.id, '->', $.typ, ',', $.enum_functions),
      seq($.id, '->', $.typ, ','),
      seq($.id, '->', $.typ),
    ),

    enum_comma: $ => choice(
      seq($.id, optional(',')),
      seq($.id, '=>', $.exp, optional(',')),
      seq($.id, ',', $.enum_comma),
      seq($.id, '=>', $.exp, ',', $.enum_comma),
    ),

    struct_field: $ => seq($.id, ':', $.typ),

    struct_fields: $ => choice(
      $.struct_field,
      seq($.struct_field, ','),
      seq($.struct_field, ',', $.struct_fields),
    ),

    type_union: $ => choice(
      seq('Private', $.type_union),
      seq($.attribute, $.type_union),
      seq($.id, ':', $.typ),
      seq($.id, ':', '{', $.struct_fields, '}'),
    ),

    type_unions: $ => choice(
      seq($.type_union, optional(',')),
      seq($.type_union, ',', $.type_unions),
    ),

    // Function definitions
    rec_measure: $ => seq('{', $.pat, '=>', $.exp, '}'),

    fun_def: $ => seq('function', optional($.rec_measure), $.funcls),

    // Mapping patterns
    mpat: $ => choice(
      prec.left(seq($.atomic_mpat, repeat(seq($.pat_op, $.atomic_mpat)))),
      seq($.atomic_mpat, 'as', $.id),
    ),

    mpat_list: $ => choice(
      seq($.mpat, optional(',')),
      seq($.mpat, ',', $.mpat_list),
    ),

    atomic_mpat: $ => choice(
      $.lit,
      $.id,
      seq($.id, '[', $.number, ']'),
      seq($.id, '[', $.number, '..', $.number, ']'),
      seq($.id, '(', ')'),
      seq($.id, '(', $.mpat_list, ')'),
      seq('(', $.mpat, ')'),
      seq('(', $.mpat, ',', $.mpat_list, ')'),
      seq('[', $.mpat_list, ']'),
      seq('[|', '|]'),
      seq('[|', $.mpat_list, '|]'),
      seq($.atomic_mpat, ':', $.typ_no_caret),
      seq('struct', optional($.id), '{', $.fmpat_list, '}'),
    ),

    fmpat_list: $ => choice(
      seq($.fmpat, optional(',')),
      seq($.fmpat, ',', $.fmpat_list),
    ),

    fmpat: $ => choice(
      seq($.id, '=', $.mpat),
      $.id,
    ),

    mpexp: $ => choice(
      $.mpat,
      seq($.mpat, 'if', $.exp),
    ),

    mapcl: $ => choice(
      seq($.attribute, $.mapcl),
      $.mapcl0,
      seq($.mapcl0, 'when', $.exp),
    ),

    mapcl0: $ => choice(
      seq($.mpexp, '<->', $.mpexp),
      seq($.mpexp, '=>', $.exp),
      seq('forwards', $.case),
      seq('backwards', $.case),
    ),

    mapcl_list: $ => choice(
      seq($.mapcl, optional(',')),
      seq($.mapcl, ',', $.mapcl_list),
    ),

    map_def: $ => choice(
      seq('mapping', $.id, '=', '{', $.mapcl_list, '}'),
      seq('mapping', $.id, ':', $.typschm, '=', '{', $.mapcl_list, '}'),
    ),

    // Let definitions
    let_def: $ => seq('let', $.letbind),

    // Pure/impure annotations
    pure_opt: $ => choice(
      'impure',
      'pure',
    ),

    // External bindings
    extern_binding: $ => choice(
      seq($.id, ':', $.string_literal),
      seq('_', ':', $.string_literal),
    ),

    extern_binding_list: $ => choice(
      seq($.extern_binding, optional(',')),
      seq($.extern_binding, ',', $.extern_binding_list),
    ),

    externs: $ => choice(
      $.string_literal,
      seq('{', $.extern_binding_list, '}'),
      seq($.pure_opt, $.string_literal),
      seq($.pure_opt, '{', $.extern_binding_list, '}'),
    ),

    // Value specifications
    val_spec_def: $ => choice(
      seq('val', $.string_literal, ':', $.typschm),
      seq('val', $.id, ':', $.typschm),
      seq('val', $.id, '=', $.externs, ':', $.typschm),
      seq('val', $.id, ':', $.typschm, '=', $.externs),
    ),

    // Register definitions
    register_def: $ => choice(
      seq('register', $.id, ':', $.typ),
      seq('register', $.id, ':', $.typ, '=', $.exp),
    ),

    // Default definitions
    default_def: $ => choice(
      seq('default', $.kind, 'inc'),
      seq('default', $.kind, 'dec'),
    ),

    // Scattered definitions
    scattered_def: $ => choice(
      seq('scattered', 'enum', $.id),
      seq('scattered', 'union', $.id, $.typaram),
      seq('scattered', 'union', $.id),
      seq('scattered', 'function', $.id),
      seq('scattered', 'mapping', $.id),
      seq('scattered', 'mapping', $.id, ':', $.funcl_typ),
      seq('enum', 'clause', $.id, '=', $.id),
      seq('function', 'clause', $.funcl),
      seq('union', 'clause', $.id, '=', $.type_union),
      seq('mapping', 'clause', $.id, '=', $.mapcl),
      seq('end', $.id),
    ),

    // Loop measures
    loop_measure: $ => choice(
      seq('until', $.exp),
      seq('repeat', $.exp),
      seq('while', $.exp),
    ),

    // Substitutions
    subst: $ => choice(
      seq($.typ_var, '=', $.typ),
      seq($.id, '=', $.id),
    ),

    // Instantiation definitions
    instantiation_def: $ => choice(
      seq('instantiation', $.id),
      seq('instantiation', $.id, 'with', $.subst, repeat(seq(',', $.subst))),
    ),

    // Overload definitions
    overload_def: $ => choice(
      seq('overload', $.id, '=', '{', $.id, repeat(seq(',', $.id)), '}'),
      seq('overload', $.id, '=', $.id, repeat(seq('|', $.id))),
    ),

    // Definitions
    def_aux: $ => choice(
      $.fun_def,
      $.map_def,
      $.fixity_def,
      $.val_spec_def,
      $.instantiation_def,
      $.type_def,
      $.let_def,
      $.register_def,
      $.overload_def,
      $.scattered_def,
      $.default_def,
      seq('constraint', $.typ),
      seq('type', 'constraint', $.typ),
      seq('structured$', $.identifier, optional(seq($.attribute_data_key_value, repeat(seq(',', $.attribute_data_key_value)))), '}'),
      $.line_directive,
      seq('termination_measure', $.id, $.pat, '=', $.exp),
      seq('termination_measure', $.id, $.loop_measure, repeat(seq(',', $.loop_measure))),
    ),

    fixity_def: $ => seq(
      choice('infix', 'infixl', 'infixr'),
      $.number,
      $.id,
    ),

    def: $ => choice(
      seq('Private', $.def),
      seq($.attribute, $.def),
      $.def_aux,
    ),
  }
});
