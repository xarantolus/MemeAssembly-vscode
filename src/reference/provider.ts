import * as vscode from 'vscode';
import { CommandInfo, getCommandsByRef, loadAvailableCommands } from '../util/tm_util';


export class DefinitionProvider implements vscode.DefinitionProvider {
    private definitions: Array<CommandInfo>;
    private references: Array<CommandInfo>;

    constructor() {
        this.definitions = getCommandsByRef("function_name:def");
        this.references = getCommandsByRef("function_name:ref");
    }

    provideDefinition(
        document: vscode.TextDocument, position: vscode.Position,
        token: vscode.CancellationToken,
    ): vscode.ProviderResult<vscode.Location[]> {
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

        var result: vscode.Location[] = [];

        var text = document.getText();
        for (let pattern of this.definitions) {
            var regex = new RegExp(pattern.match, "g")

            var match: RegExpExecArray | null = null;
            while (null != (match = regex.exec(text))) {
                if (match[1] == needleFunctionName) {
                    result.push(
                        new vscode.Location(document.uri, document.positionAt(match.index + match[0].length - match[1].length))
                    )
                }
            }
        }


        return result;
    }
}
