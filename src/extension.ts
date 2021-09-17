import * as vscode from 'vscode';
import { platform } from 'os';

import { checkCommandInstalled } from './check_install'
import { runCurrentFile } from './commands/run';

import { HoverProvider } from './hover_cards';

export function activate(context: vscode.ExtensionContext) {
    if (platform() == 'linux') {
        checkCommandInstalled();
    }

    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand("memeasm.run-file", runCurrentFile)
    );

    context.subscriptions.push(
        vscode.languages.registerHoverProvider('memeasm', new HoverProvider())
    );
}
