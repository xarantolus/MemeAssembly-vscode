import * as vscode from 'vscode';
import { DefinitionFinder } from '../util/functions';
import { CommandInfo, getCommandsByRef } from '../util/tm_util';


export class FunctionReferenceProvider implements vscode.ReferenceProvider {
    private definitions: Array<CommandInfo>;

    constructor() {
        this.definitions = getCommandsByRef("function_name:def");
    }

    async provideReferences(
        document: vscode.TextDocument, position: vscode.Position, context: vscode.ReferenceContext,
        token: vscode.CancellationToken
    ): Promise<vscode.Location[]> {
        var currentLine = document.lineAt(position);

        let needleFunctionName: string | null = null;
        for (let pattern of this.definitions) {
            var regex = new RegExp(pattern.match, "g")
            var match = regex.exec(currentLine.text);
            if (!match) {
                continue;
            }

            needleFunctionName = match[1];
        }

        // Now we search all workspace MemeAssembly files for function references
        var defs = await (new DefinitionFinder("function_name:ref", true)).findAllDefinitions(document, token);

        return defs
            .filter(def => def.functionName === needleFunctionName)
            .map(def => def.location);
    }
}
