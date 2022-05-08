import * as vscode from 'vscode';
import { DefinitionFinder } from '../util/definition_finder';
import { CommandInfo, getCommandsByRef } from '../util/tm_util';


export class FunctionReferenceProvider implements vscode.ReferenceProvider {
    private functionDefinitionFinder: DefinitionFinder;

    constructor() {
        this.functionDefinitionFinder = new DefinitionFinder("function_name:def", false);
    }

    async provideReferences(
        document: vscode.TextDocument, position: vscode.Position, context: vscode.ReferenceContext,
        token: vscode.CancellationToken
    ): Promise<vscode.Location[]> {
        let functionRef = this.functionDefinitionFinder.matchSingleLine(document, position.line);
        if (!functionRef) return [];


        // Now we search all workspace MemeAssembly files for function references
        var defs = await (new DefinitionFinder("function_name:ref", true)).findAllDefinitions(document, token);

        return defs
            .filter(def => def.customName === functionRef!.customName)
            .map(def => def.location);
    }
}
