import { assert } from 'console';
import * as vscode from 'vscode';
import { CommandInfo, FormattingCombination, getLoopCombinations, getCommandsByFormattingGuideline, getCommandsByRef, matchesLine } from '../util/tm_util';

export class FileFormattingProvider implements vscode.DocumentFormattingEditProvider {
    // blockStarts and matching blockEnds increase/decrease the indent by 1
    private blockStarts: CommandInfo[];
    private blockEnds: CommandInfo[];

    // combos are combinations like "banana" and "where banana" where there should be indent if they are in the
    // correct order, but not if they are in a different order
    private combos: FormattingCombination[];

    constructor() {
        this.blockStarts = getCommandsByFormattingGuideline("block:start");
        assert(this.blockStarts.length > 0);
        this.blockEnds = getCommandsByFormattingGuideline("block:end");
        assert(this.blockEnds.length > 0);

        this.combos = getLoopCombinations()
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
            else if (matchesLine(this.blockStarts, currentLine.text)) {
                indentLvl++;
            } else if (matchesLine(this.blockEnds, currentLine.text)) {
                indentLvl = Math.max(0, indentLvl - 1)
            } else {
                for (const cmb of this.combos) {
                    let marker: string | boolean;
                    if (marker = matchesLine([cmb.start], currentLine.text)) {
                        // We have found a start line for our combination.
                        // If we also find an end line further down the road, we can increase the indent
                        for (let nextIdx = lineIdx + 1; nextIdx < document.lineCount; nextIdx++) {
                            const nextLine = document.lineAt(nextIdx);

                            let m2 = matchesLine([cmb.end], nextLine.text);
                            if (m2 == marker) {
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
                            if (m2 == marker) {
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
