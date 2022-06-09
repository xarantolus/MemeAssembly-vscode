import assert = require('assert');
import * as vscode from 'vscode';

import { getCommandsByFormattingGuideline, CommandInfo, matchesLine } from './tm_util';


export class FunctionRangeFinder {
    private functionStarts: CommandInfo[];
    private functionEnds: CommandInfo[];

    constructor() {
        this.functionStarts = getCommandsByFormattingGuideline("function:start");
        assert(this.functionStarts.length > 0);
        this.functionEnds = getCommandsByFormattingGuideline("function:end");
        assert(this.functionEnds.length > 0);

    }

    // findFunctionRange returns the function boundaries
    //  surrounding the position or range in the document,
    // with start and end being line numbers (inclusive)
    public findFunctionRange(position: vscode.Position | vscode.Range, document: vscode.TextDocument): { start: number, end: number } {
        let currentLineNumber = (position instanceof vscode.Position) ? position.line : position.start.line;

        let functionStartLine = -1;
        for (let i = currentLineNumber; i >= 0; i--) {
            if (matchesLine(this.functionStarts, document.lineAt(i).text)) {
                functionStartLine = i;
                break;
            }
        }
        if (functionStartLine < 0) {
            throw new Error("could not find function start line");
        }

        // Now search for the end. This is a bit more tricky, as we need only the last functionEnd before
        // the EOF or before another functionStart
        let functionEndLine = -1;
        for (let i = currentLineNumber; i < document.lineCount; i++) {
            let txt = document.lineAt(i).text;
            if (matchesLine(this.functionEnds, txt)) {
                functionEndLine = i;
            } else if (matchesLine(this.functionStarts, txt)) {
                // We have found the next function start, so now we know the last end we saw must be valid
                break;
            }
        }
        if (functionEndLine < 0) {
            throw new Error("could not find function end line");
        }


        return {
            start: functionStartLine,
            end: functionEndLine,
        }
    }
}
