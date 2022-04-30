import * as vscode from 'vscode';
import { DefinitionFinder } from '../util/definition_finder';

export class SymbolProvider implements vscode.DocumentSymbolProvider {
    private finder: DefinitionFinder;

    constructor() {
        this.finder = new DefinitionFinder("function_name:def", false);
    }

    async provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.SymbolInformation[]> {
        let definitions = await this.finder.fromFile(document)

        return definitions
            .map(def =>
                new vscode.SymbolInformation(def.customName, vscode.SymbolKind.Function, "", def.location)
            )
    }
}
