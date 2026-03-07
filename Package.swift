// swift-tools-version:5.3

import Foundation
import PackageDescription

var sources = ["grammars/sail/src/parser.c"]
if FileManager.default.fileExists(atPath: "grammars/sail/src/scanner.c") {
    sources.append("grammars/sail/src/scanner.c")
}

let package = Package(
    name: "TreeSitterSail",
    products: [
        .library(name: "TreeSitterSail", targets: ["TreeSitterSail"]),
    ],
    dependencies: [
        .package(url: "https://github.com/tree-sitter/swift-tree-sitter", from: "0.8.0"),
    ],
    targets: [
        .target(
            name: "TreeSitterSail",
            dependencies: [],
            path: ".",
            sources: sources,
            resources: [
                .copy("queries")
            ],
            publicHeadersPath: "bindings/swift",
            cSettings: [.headerSearchPath("grammars/sail/src")]
        ),
        .testTarget(
            name: "TreeSitterSailTests",
            dependencies: [
                "SwiftTreeSitter",
                "TreeSitterSail",
            ],
            path: "bindings/swift/TreeSitterSailTests"
        )
    ],
    cLanguageStandard: .c11
)
