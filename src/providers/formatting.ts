import { assert } from 'console';
import * as vscode from 'vscode';
import { CommandInfo, FormattingCombination, getCommandCombinations, getCommandsByFormattingGuideline, getLoopCombinations, matchesLine } from '../util/tm_util';

export class FileFormattingProvider implements vscode.DocumentFormattingEditProvider {
    // functionStarts and matching functionEnds increase/decrease the indent by 1
    private functionStarts: CommandInfo[];
    private functionEnds: CommandInfo[];

    // combos are combinations like "banana" and "where banana" where there should be indent if they are in the
    // correct order, but not if they are in a different order
    private combos: FormattingCombination[];

    constructor() {
        this.functionStarts = getCommandsByFormattingGuideline("function:start");
        assert(this.functionStarts.length > 0);
        this.functionEnds = getCommandsByFormattingGuideline("function:end");
        assert(this.functionEnds.length > 0);

        this.combos = getCommandCombinations()
    }

    private isComment(line: vscode.TextLine) {
        var reduced = line.text.substring(line.firstNonWhitespaceCharacterIndex);
        return reduced.startsWith("What the hell happened here?")
    }

    formatDocument(document: vscode.TextDocument, options: vscode.FormattingOptions): vscode.TextEdit[] {
        let indent = options.insertSpaces ? " ".repeat(options.tabSize) : "\t";

        let results: vscode.TextEdit[] = [];

        let indentLvl = 0;

        for (let lineIdx = 0; lineIdx < document.lineCount; lineIdx++) {
            const currentLine = document.lineAt(lineIdx);

            // The current lines' formatting is always defined by the current state, except
            // when closing a combo
            var currentEdit = new vscode.TextEdit(currentLine.range,
                indent.repeat(indentLvl) +
                currentLine.text.substring(currentLine.firstNonWhitespaceCharacterIndex)
            );

            if (this.isComment(currentLine)) {
                /*
                Don't do anything
                This prevents matching comments that also contain code snippets
                */
            }
            else if (matchesLine(this.functionStarts, currentLine.text)) {
                indentLvl++;
            } else if (matchesLine(this.functionEnds, currentLine.text)) {
                // Only decrease indent if we do not find another functionEnd before the next functionStart
                // This allows a function to have multiple return statements
                let shouldDecrease = true;
                for (let nextLineIdx = lineIdx + 1; nextLineIdx < document.lineCount; nextLineIdx++) {
                    const nextLine = document.lineAt(nextLineIdx);

                    if (matchesLine(this.functionEnds, nextLine.text)) {
                        shouldDecrease = false;
                        break;
                    }

                    if (matchesLine(this.functionStarts, nextLine.text)) {
                        shouldDecrease = true;
                        break;
                    }
                }

                if (shouldDecrease) {
                    indentLvl = Math.max(0, indentLvl - 1);
                }
            } else {
                for (const cmb of this.combos) {
                    let marker: string | boolean;
                    if (marker = matchesLine([cmb.start], currentLine.text)) {
                        // We have found a start line for our combination.
                        // If we also find an end line further down the road, we can increase the indent
                        for (let nextIdx = lineIdx + 1; nextIdx < document.lineCount; nextIdx++) {
                            const nextLine = document.lineAt(nextIdx);

                            let m2 = matchesLine([cmb.end], nextLine.text);
                            if (m2 == marker || (!cmb.exactMatchRequired && m2) ) {
                                indentLvl++;
                                break;
                            }
                        }
                    }
                    if (marker = matchesLine([cmb.end], currentLine.text)) {
                        // We have found the end of our combination.
                        // If we had a start line before, we can decrease the indent lvl
                        for (let prevIdx = lineIdx - 1; prevIdx >= 0; prevIdx--) {
                            const prevLine = document.lineAt(prevIdx);

                            let m2 = matchesLine([cmb.start], prevLine.text);
                            if (m2 == marker || (!cmb.exactMatchRequired && m2)) {
                                indentLvl = Math.max(0, indentLvl - 1);

                                currentEdit = new vscode.TextEdit(currentLine.range,
                                    indent.repeat(indentLvl) +
                                    currentLine.text.substring(currentLine.firstNonWhitespaceCharacterIndex)
                                );

                                break;
                            }
                        }
                    }
                }
            }

            results.push(currentEdit);
        }

        return results;
    }

    provideDocumentFormattingEdits(
        document: vscode.TextDocument, options: vscode.FormattingOptions,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.TextEdit[]> {
        return this.formatDocument(document, options);
    }
}

export class TypingFormattingProvider implements vscode.OnTypeFormattingEditProvider {
    private fileFormatter: FileFormattingProvider;

    constructor(formatter: FileFormattingProvider) {
        this.fileFormatter = formatter;
    }

    provideOnTypeFormattingEdits(
        document: vscode.TextDocument, position: vscode.Position,
        ch: string, options: vscode.FormattingOptions,
        token: vscode.CancellationToken): vscode.ProviderResult<vscode.TextEdit[]> {

        let results = this.fileFormatter.formatDocument(document, options);

        return results;
    }
}
