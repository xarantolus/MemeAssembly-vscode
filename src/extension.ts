import { platform } from 'os';
import * as vscode from 'vscode';

import { insertPrintCommands } from './commands/insert_print';
import { checkForInstallOrUpdate } from './commands/install_update';
import { runCurrentFile } from './commands/run';

import { LenseProvider } from './providers/code_lense';
import { FunctionDefinitionProvider, LoopDefinitionProvider } from './providers/definitions';
import { FileFormattingProvider, TypingFormattingProvider } from './providers/formatting';
import { HoverProvider } from './providers/hover';
import { FunctionReferenceProvider } from './providers/reference';
import { CascadingRenameProvider, FunctionRenameProvider, RegisterRenameProvider, SameFileRenameProvider } from './providers/rename';
import { SymbolProvider } from './providers/symbols';
import { FunctionFoldingProvider } from './providers/folding';



export function activate(context: vscode.ExtensionContext) {
    if (platform() == 'linux') {
        checkForInstallOrUpdate(false);
    }

    let fileFormatter = new FileFormattingProvider();
    context.subscriptions.push(...[
        // "Run current file" command
        vscode.commands.registerTextEditorCommand("memeasm.run-file", runCurrentFile),

        // For updating the MemeAssembly compiler
        vscode.commands.registerTextEditorCommand("memeasm.update", () => checkForInstallOrUpdate(true)),

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
        }),

        vscode.languages.registerRenameProvider('memeasm', new CascadingRenameProvider(
            new RegisterRenameProvider(),
            // Rename provider for functions
            new FunctionRenameProvider(),
            // ...as well as certain loops
            new SameFileRenameProvider("monke_loop", {
                pattern: "\\b((?:a|u)*(?:au|ua)+(?:a|u)*)\\b",
                description: "The name must only contain 'a' and 'u', and at least one of each"
            }),
        )),

        // Provide inline buttons for running main functions
        vscode.languages.registerCodeLensProvider('memeasm', new LenseProvider()),

        // Provide folding for functions
        vscode.languages.registerFoldingRangeProvider('memeasm', new FunctionFoldingProvider()),
    ]);
}
