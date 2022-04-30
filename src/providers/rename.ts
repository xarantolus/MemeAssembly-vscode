import * as vscode from 'vscode';
import { DefinitionFinder } from '../util/definition_finder';
import { getCommandsByRef } from '../util/tm_util';


export class RenameProvider implements vscode.RenameProvider {
    private definitionFinder: DefinitionFinder;

    constructor() {
        this.definitionFinder = DefinitionFinder.withDefinitions([
            ...getCommandsByRef("function_name:ref"),
            ...getCommandsByRef("function_name:def"),
        ], false);
    }

    private currentLineInfo(document: vscode.TextDocument, position: vscode.Position): { range: vscode.Range, placeholder: string } {
        let match = this.definitionFinder.matchSingleLine(document, position.line)
        if (!match)
            throw new Error("cannot rename at this position")

        return {
            placeholder: match.customName,
            range: match.location.range
        };

    }

    prepareRename(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): { range: vscode.Range, placeholder: string } {
        return this.currentLineInfo(document, position);
    }

    async provideRenameEdits(
        document: vscode.TextDocument, position: vscode.Position,
        newName: string, token: vscode.CancellationToken,
    ): Promise<vscode.WorkspaceEdit> {
        let info = this.currentLineInfo(document, position);

        let edit = new vscode.WorkspaceEdit();

        let currentFileDefs = await this.definitionFinder.fromFile(document)
        for (const d of currentFileDefs) {
            if (d.customName == info.placeholder) {
                edit.replace(document.uri, d.location.range, newName);
            }
        }

        // Search within the workspace, but skip the already edited current file
        let sameDefinitions = (await this.definitionFinder.findAllDefinitions(document, token))
            .filter(d => d.customName === info.placeholder && d.location.uri.path != document.uri.path);
        for (const def of sameDefinitions) {

            edit.replace(def.location.uri, def.location.range, newName)
        }

        return edit;
    }
}
