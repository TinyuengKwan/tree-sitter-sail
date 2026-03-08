cmake_minimum_required(VERSION 3.13)

project(tree-sitter-sail
        VERSION "0.1.0"
        DESCRIPTION "Tree-sitter for the Sail instruction-set semantics specification language."
        HOMEPAGE_URL "https://github.com/TinyuengKwan/tree-sitter-sail"
        LANGUAGES C)

option(BUILD_SHARED_LIBS "Build using shared libraries" ON)
option(TREE_SITTER_REUSE_ALLOCATOR "Reuse the library allocator" OFF)

set(TREE_SITTER_ABI_VERSION 15 CACHE STRING "Tree-sitter ABI version")
if(NOT ${TREE_SITTER_ABI_VERSION} MATCHES "^[0-9]+$")
    unset(TREE_SITTER_ABI_VERSION CACHE)
    message(FATAL_ERROR "TREE_SITTER_ABI_VERSION must be an integer")
endif()

find_program(TREE_SITTER_CLI tree-sitter DOC "Tree-sitter CLI")

include(GNUInstallDirs)

macro(add_parser name)
    add_custom_command(OUTPUT "${CMAKE_CURRENT_SOURCE_DIR}/src/parser.c"
                       DEPENDS "${CMAKE_CURRENT_SOURCE_DIR}/grammar.js"
                       COMMAND "${TREE_SITTER_CLI}" generate
                       WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}"
                       COMMENT "Generating parser.c")

    add_library(tree-sitter-${name} "${CMAKE_CURRENT_SOURCE_DIR}/src/parser.c")
    if(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/src/scanner.c")
        target_sources(tree-sitter-${name} PRIVATE "${CMAKE_CURRENT_SOURCE_DIR}/src/scanner.c")
    endif()

    target_include_directories(tree-sitter-${name}
                               PRIVATE "${CMAKE_CURRENT_SOURCE_DIR}/src"
                               INTERFACE $<BUILD_INTERFACE:${CMAKE_SOURCE_DIR}/bindings/c>
                                         $<INSTALL_INTERFACE:${CMAKE_INSTALL_INCLUDEDIR}>)

    target_compile_definitions(tree-sitter-${name} PRIVATE
                               $<$<BOOL:${TREE_SITTER_REUSE_ALLOCATOR}>:TREE_SITTER_REUSE_ALLOCATOR>
                               $<$<CONFIG:Debug>:TREE_SITTER_DEBUG>)

    set_target_properties(tree-sitter-${name}
                          PROPERTIES
                          C_STANDARD 11
                          POSITION_INDEPENDENT_CODE ON
                          SOVERSION "${TREE_SITTER_ABI_VERSION}.${PROJECT_VERSION_MAJOR}"
                          DEFINE_SYMBOL "")

    configure_file("${CMAKE_SOURCE_DIR}/bindings/c/tree-sitter-${name}.pc.in"
                   "${CMAKE_CURRENT_BINARY_DIR}/tree-sitter-${name}.pc" @ONLY)

    install(DIRECTORY "${CMAKE_SOURCE_DIR}/bindings/c/tree_sitter"
            DESTINATION "${CMAKE_INSTALL_INCLUDEDIR}"
            FILES_MATCHING PATTERN "*.h")
    install(FILES "${CMAKE_CURRENT_BINARY_DIR}/tree-sitter-${name}.pc"
            DESTINATION "${CMAKE_INSTALL_DATAROOTDIR}/pkgconfig")
    install(TARGETS tree-sitter-${name}
            LIBRARY DESTINATION "${CMAKE_INSTALL_LIBDIR}")
endmacro()

set(PROJECT_DESCRIPTION "Tree-sitter for the Sail instruction-set semantics specification language.")
add_parser(sail)

file(GLOB QUERIES queries/*.scm)
install(FILES ${QUERIES}
        DESTINATION "${CMAKE_INSTALL_DATADIR}/tree-sitter/queries/sail")

add_custom_target(test "${TREE_SITTER_CLI}" test
                  WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}"
                  COMMENT "tree-sitter test")
