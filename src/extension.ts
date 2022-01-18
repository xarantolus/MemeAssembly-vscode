import * as vscode from 'vscode';
import { platform } from 'os';

import { checkCommandInstalled } from './commands/install_update'
import { runCurrentFile } from './commands/run';

import { HoverProvider } from './hover/provider';

export function activate(context: vscode.ExtensionContext) {
    if (platform() == 'linux') {
        checkCommandInstalled(false);
    }

    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand("memeasm.run-file", runCurrentFile),
    );

    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand("memeasm.update", () => checkCommandInstalled(true)),
    );

    context.subscriptions.push(
        vscode.languages.registerHoverProvider('memeasm', new HoverProvider())
    );
}
