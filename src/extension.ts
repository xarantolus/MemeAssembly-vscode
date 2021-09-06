import * as vscode from 'vscode';
import { platform } from 'os';

import { checkCommandInstalled } from './check_install'
import { runCurrentFile } from './commands/run';

export function activate(context: vscode.ExtensionContext) {
    if (platform() == 'linux') {
        checkCommandInstalled();
    }

    vscode.commands.registerTextEditorCommand("memeasm.run-file", runCurrentFile);
}
