import * as vscode from 'vscode';
import { DefinitionFinder } from '../util/functions';
import { CommandInfo, getCommandsByRef, matchesLine } from '../util/tm_util';

export class Lense extends vscode.CodeLens {
    constructor(range: vscode.Range) {
        super(range,
            {
                title: "Run program",
                command: "memeasm.run-file",
                tooltip: "Runs the current file"
            }
        );
    }
}

export class LenseProvider implements vscode.CodeLensProvider<Lense> {
    private functionDefs: Array<CommandInfo>;

    constructor() {
        this.functionDefs = getCommandsByRef("function_name:def");
    }

    async provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<Lense[]> {
        var defs = await DefinitionFinder.withDefinitions(this.functionDefs, true).fromFile(document)

        // There can only be one main function
        let mainFuncs = defs.filter(d => d.customName == 'main');
        if (mainFuncs.length != 1) {
            return [];
        }

        return [new Lense(mainFuncs[0].location.range)];
    }
}
