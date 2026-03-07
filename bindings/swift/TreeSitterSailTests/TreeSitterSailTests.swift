import XCTest
import SwiftTreeSitter
import TreeSitterSail

final class TreeSitterSailTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_sail())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Sail grammar")
    }
}
