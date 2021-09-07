import * as vscode from 'vscode';
import { platform } from 'os';
import { exec, ExecException } from 'child_process';
import path = require('path');

function installMemeAssembly() {
    vscode.window.withProgress({
        "cancellable": false,
        "location": vscode.ProgressLocation.Window,
        "title": "Installing MemeAssembly..."
    }, async (progress, token) => {
        await new Promise((resolve, reject) => {
            const termName = "Install MemeAssembly";

            var scriptLocation = path.join(__dirname, "../scripts/install_memeassembly.sh");
            var term = vscode.window.createTerminal(termName, "bash", [scriptLocation]);
            term.show();

            vscode.window.onDidCloseTerminal(term => {
                if (term.name === termName) {
                    resolve(null);
                }
            })
        });
    });
}

export function checkCommandInstalled() {
    var process = exec("memeasm -h");

    process.on('exit', function (code: number) {
        if (code !== 0) {
            vscode.window.showWarningMessage("The MemeAssembly Compiler is not installed.", "Install").
                then(item => {
                    // If the user didn't click the item
                    if (!item) {
                        return;
                    }

                    installMemeAssembly();
                });
        }
    })
}
