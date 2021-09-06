import * as vscode from 'vscode';
import { platform } from 'os';

import { checkCommandInstalled } from './check_install'

export function activate(context: vscode.ExtensionContext) {
    if (platform() == 'linux') {
        checkCommandInstalled();
    }
}
