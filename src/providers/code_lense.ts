import * as vscode from 'vscode';
import { DefinitionFinder } from '../util/definition_finder';
import { CommandInfo, getCommandsByRef } from '../util/tm_util';

export class Lense extends vscode.CodeLens {
    constructor(range: vscode.Range, debug: boolean) {
        super(range,
            debug ? {
                title: "Debug program",
                command: "memeasm.run-file",
                tooltip: "Runs the current file",
                arguments: ["debug"]
            } : {
                title: "Run program",
                command: "memeasm.run-file",
                tooltip: "Runs the current file",
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
        let defs = await DefinitionFinder.withDefinitions(this.functionDefs, true).fromFile(document)

        // There can only be one main function
        let mainFuncs = defs.filter(d => d.customName == 'main');
        if (mainFuncs.length != 1) {
            return [];
        }

        return [
            new Lense(mainFuncs[0].location.range, false),
            new Lense(mainFuncs[0].location.range, true),
        ];
    }
}
