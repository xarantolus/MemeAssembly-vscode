import * as vscode from 'vscode';
import { DefinitionFinder } from '../util/definition_finder';

export class FunctionFoldingProvider implements vscode.FoldingRangeProvider {
    private foldingStarts: DefinitionFinder;
    private foldingEnds: DefinitionFinder;

    constructor() {
        this.foldingStarts = new DefinitionFinder("function_name:def", true);
        this.foldingEnds = new DefinitionFinder("function_end", true);
    }

    async provideFoldingRanges(
        document: vscode.TextDocument, context: vscode.FoldingContext,
        token: vscode.CancellationToken
    ): Promise<vscode.FoldingRange[]> {
        let starts = await this.foldingStarts.fromFile(document);

        // The list of ends is reversed to always pick the last return statement
        // in a function with multiple returns
        let ends = (await this.foldingEnds.fromFile(document)).reverse();

        let results: vscode.FoldingRange[] = [];
        for (let idx = 0; idx < starts.length; idx++) {
            const currentLine = starts[idx].location.range.start.line;
            const nextLine = starts[idx + 1]?.location.range.start.line;

            let match = ends.find((end) => {
                let line = end.location.range.start.line;

                // The match must be below the current line, but
                // also before the next matching item
                return line > currentLine
                    && (!nextLine || line < nextLine)
            })
            if (match) {
                results.push(
                    new vscode.FoldingRange(currentLine, match.location.range.start.line)
                );
            }
        }

        return results;
    }
}
