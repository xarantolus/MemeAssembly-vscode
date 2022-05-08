import * as vscode from 'vscode';
import { DefinitionFinder } from '../util/definition_finder';
import { FormattingCombination, getCommandCombo, getCommandsByRef } from '../util/tm_util';

// This class exists because of the following reason:
// If we register multiple rename providers and rename a symbol that is matched by one of them,
// but we then press escape to stop the rename, the error message of the next rename provider is shown
// This message is also concatenated with all other errors which is not nice.
// Instead here we just return the first error message
export class CascadingRenameProvider implements vscode.RenameProvider {
    private providers: vscode.RenameProvider[];

    constructor(...providers: vscode.RenameProvider[]) {
        this.providers = providers;
    }

    prepareRename(
        document: vscode.TextDocument, position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Range | { range: vscode.Range; placeholder: string; }> {

        for (const provider of this.providers) {
            try {
                if (provider.prepareRename) {
                    let rename = provider.prepareRename(document, position, token);
                    return rename;
                }
            } catch (_) { }
        }

        throw new RenamePreparationException("Nothing to rename at this position");
    }

    async provideRenameEdits(
        document: vscode.TextDocument, position: vscode.Position,
        newName: string, token: vscode.CancellationToken,
    ): Promise<vscode.WorkspaceEdit> {
        for (const provider of this.providers) {
            try {
                let rename = await provider.provideRenameEdits(document, position, newName, token);
                if (rename && rename.size > 0)
                    return rename;
            } catch (e) {
                if (e instanceof RenamePreparationException) {
                    continue;
                }

                throw e;
            }
        }
        throw new Error("Cannot provide rename functionality");
    }
}


export class FunctionRenameProvider implements vscode.RenameProvider {
    private definitionFinder: DefinitionFinder;

    constructor() {
        this.definitionFinder = DefinitionFinder.withDefinitions([
            ...getCommandsByRef("function_name:ref"),
            ...getCommandsByRef("function_name:def"),
        ], false);
    }

    private currentLineInfo(document: vscode.TextDocument, position: vscode.Position): { range: vscode.Range, placeholder: string } {
        let match = this.definitionFinder.matchSingleLine(document, position.line)
        if (!match) {
            throw new RenamePreparationException("cannot rename functions at this position");
        }

        return {
            placeholder: match.customName,
            range: match.location.range
        };
    }

    prepareRename(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): { range: vscode.Range, placeholder: string } | null {
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


export class SameFileRenameProvider implements vscode.RenameProvider {
    private finder: DefinitionFinder;

    private renameMatch: string | undefined;
    private matchDescription: string | undefined;

    constructor(refs: FormattingCombination | string, renameMatch: { pattern: string, description: string } | undefined) {
        let combo = (refs instanceof FormattingCombination) ? refs : getCommandCombo("monke_loop");

        this.finder = DefinitionFinder.withDefinitions([combo.start, combo.end], false);

        this.renameMatch = renameMatch?.pattern;
        this.matchDescription = renameMatch?.description;
    }

    private currentLineInfo(document: vscode.TextDocument, position: vscode.Position): { range: vscode.Range, placeholder: string } {
        let match = this.finder.matchSingleLine(document, position.line);
        if (!match) {
            throw new RenamePreparationException("cannot rename for the same file at this position")
        }

        return {
            placeholder: match.customName,
            range: match.location.range,
        };
    }

    prepareRename(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): { range: vscode.Range, placeholder: string } | null {
        return this.currentLineInfo(document, position);
    }

    async provideRenameEdits(
        document: vscode.TextDocument, position: vscode.Position,
        newName: string, token: vscode.CancellationToken,
    ): Promise<vscode.WorkspaceEdit> {
        if (this.renameMatch && !(new RegExp(this.renameMatch)).test(newName)) {
            throw new Error(this.matchDescription || "Invalid name")
        }

        let info = this.currentLineInfo(document, position);

        let edit = new vscode.WorkspaceEdit();

        let currentFileDefs = await this.finder.fromFile(document)
        for (const d of currentFileDefs) {
            if (d.customName == info.placeholder) {
                edit.replace(document.uri, d.location.range, newName);
            }
        }

        if (edit.size > 0)
            return edit;

        throw new Error("Cannot provide rename at this position");
    }
}


class RenamePreparationException extends Error {
    constructor(msg: string) {
        super(msg);
    }
}
