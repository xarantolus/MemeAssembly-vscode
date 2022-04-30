import * as vscode from 'vscode';
import { platform } from 'os';

import { checkCommandInstalled } from './commands/install_update'
import { runCurrentFile } from './commands/run';

import { HoverProvider } from './hover/provider';
import { insertPrintCommands } from './commands/insert_print';
import { FunctionDefinitionProvider } from './definition/provider';
import { FunctionReferenceProvider } from './reference/provider';
import { FileFormattingProvider, TypingFormattingProvider } from './formatting/provider';

export function activate(context: vscode.ExtensionContext) {
    if (platform() == 'linux') {
        checkCommandInstalled(false);
    }

    context.subscriptions.push(...[
        vscode.commands.registerTextEditorCommand("memeasm.run-file", runCurrentFile),
        vscode.commands.registerTextEditorCommand("memeasm.update", () => checkCommandInstalled(true)),
        vscode.commands.registerTextEditorCommand("memeasm.insert-print", () => insertPrintCommands()),

        vscode.languages.registerDefinitionProvider("memeasm", new FunctionDefinitionProvider()),
        vscode.languages.registerReferenceProvider("memeasm", new FunctionReferenceProvider()),
        vscode.languages.registerHoverProvider('memeasm', new HoverProvider()),
        vscode.languages.registerDocumentFormattingEditProvider('memeasm', new FileFormattingProvider()),
        vscode.languages.registerOnTypeFormattingEditProvider('memeasm', new TypingFormattingProvider(), ' ', '\t', '\n')
    ]);
}
