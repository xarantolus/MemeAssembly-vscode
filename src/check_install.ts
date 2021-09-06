import * as vscode from 'vscode';
import { platform } from 'os';
import { exec, ExecException } from 'child_process';
import path = require('path');

function installMemeAssembly() {
    var scriptLocation = path.join(__dirname, "../scripts/install_memeassembly.sh");
    var term = vscode.window.createTerminal("Install MemeAssembly", "bash", [scriptLocation])
    term.show();
}

export function checkCommandInstalled() {
    var process = exec("memeasm -h");

    process.on('exit', function (code: number) {
        if (code !== 0) {
            vscode.window.showWarningMessage("It seems like MemeAssembly is not installed yet.", "Install").
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
