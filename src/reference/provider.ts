import * as vscode from 'vscode';
import { DefinitionFinder } from '../util/functions';
import { CommandInfo, getCommandsByRef, loadAvailableCommands } from '../util/tm_util';


export class DefinitionProvider implements vscode.DefinitionProvider {
    private references: Array<CommandInfo>;

    constructor() {
        this.references = getCommandsByRef("function_name:ref");
    }

    async provideDefinition(
        document: vscode.TextDocument, position: vscode.Position,
        token: vscode.CancellationToken,
    ): Promise<vscode.Location[]> {
        var currentLine = document.lineAt(position);

        let needleFunctionName: string | null = null;
        for (let pattern of this.references) {
            var regex = new RegExp(pattern.match, "g")
            var match = regex.exec(currentLine.text);
            if (!match) {
                continue;
            }

            needleFunctionName = match[1];
        }

        // Now we search all workspace MemeAssembly files for function definitions
        var defs = await (new DefinitionFinder("function_name:def")).findAllDefinitions(document, token);

        return defs
            .filter(def => def.functionName === needleFunctionName)
            .map(def => def.location);
    }
}
