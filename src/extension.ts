import * as vscode from 'vscode';
import { platform } from 'os';

import { checkCommandInstalled } from './commands/install_update'
import { runCurrentFile } from './commands/run';

import { HoverProvider } from './hover/provider';
import { insertPrintCommands } from './commands/insert_print';
import { FunctionDefinitionProvider, LoopDefinitionProvider } from './definition/provider';
import { FunctionReferenceProvider } from './reference/provider';
import { FileFormattingProvider, TypingFormattingProvider } from './formatting/provider';
import { SymbolProvider } from './symbols/provider';

export function activate(context: vscode.ExtensionContext) {
    if (platform() == 'linux') {
        checkCommandInstalled(false);
    }

    let fileFormatter = new FileFormattingProvider();
    context.subscriptions.push(...[
        // "Run current file" command
        vscode.commands.registerTextEditorCommand("memeasm.run-file", runCurrentFile),

        // For updating the MemeAssembly compiler
        vscode.commands.registerTextEditorCommand("memeasm.update", () => checkCommandInstalled(true)),

        // Insert print commands for long texts
        vscode.commands.registerTextEditorCommand("memeasm.insert-print", () => insertPrintCommands()),

        // Now definition providers: these allow jumping to a function definition (from a call command)
        vscode.languages.registerDefinitionProvider("memeasm", new FunctionDefinitionProvider()),
        // ... or to the opposite "side" of a loop (and generally jump markers)
        vscode.languages.registerDefinitionProvider("memeasm", new LoopDefinitionProvider()),
        // The reference provider shows where a function is called from
        vscode.languages.registerReferenceProvider("memeasm", new FunctionReferenceProvider()),

        // The hover provider defines how hovering a line of text works (providing definitions)
        vscode.languages.registerHoverProvider('memeasm', new HoverProvider()),

        // The formatting providers format the document
        vscode.languages.registerDocumentFormattingEditProvider('memeasm', fileFormatter),
        vscode.languages.registerOnTypeFormattingEditProvider('memeasm', new TypingFormattingProvider(fileFormatter), ' ', '\t', '\n'),

        // Provide the "Outline" feature
        vscode.languages.registerDocumentSymbolProvider('memeasm', new SymbolProvider(), {
            label: "MemeAssembly"
        })
    ]);
}
