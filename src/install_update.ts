import * as vscode from 'vscode';
import { exec, ExecException } from 'child_process';
import path = require('path');
import { Octokit } from "@octokit/rest";


// installMemeAssembly runs the MemeAssembly installation script
function installMemeAssembly() {
    vscode.window.withProgress({
        "cancellable": false,
        "location": vscode.ProgressLocation.Window,
        "title": "Installing MemeAssembly..."
    }, async (progress, token) => {
        await new Promise((resolve, reject) => {
            const termName = "Install MemeAssembly";

            // TODO: different installation strategy for Windows
            var scriptLocation = path.join(__dirname, "../scripts/install_memeassembly.sh");
            var term = vscode.window.createTerminal(termName, "bash", [scriptLocation]);
            term.show();

            vscode.window.onDidCloseTerminal(closedTerm => {
                if (closedTerm.name === termName) {
                    resolve(null);
                }
            })
        });
    });
}

// installIfAccepted runs the installation script if userAccepted is truthy
function installIfAccepted(userAccepted: any): void {
    if (!userAccepted) {
        return;
    }

    // We can just re-run the install script to update
    installMemeAssembly();
}

// checkForUpdate checks if the version number on GitHub is newer than the currently installed one.
// If showNoUpdate is true, it will show a note if no update was found
async function checkForUpdate(installedVersionNumber: string, showNoUpdate?: boolean) {
    let githubAPI = new Octokit();

    // Get the latest release from GitHub
    var latestRelease = await githubAPI.repos.getLatestRelease({
        owner: "kammt",
        repo: "MemeAssembly",
    });

    let onlineVersionNumber = latestRelease.data.tag_name.trim();

    if (installedVersionNumber == onlineVersionNumber) {
        // Latest version installed
        if (showNoUpdate) {
            vscode.window.showInformationMessage(`The latest version ${onlineVersionNumber} of MemeAssembly is already installed`)
        }
        return;
    }

    vscode.window
        .showWarningMessage(`A new version of MemeAssembly is available. Do you want to update from version ${installedVersionNumber} to ${onlineVersionNumber}?`, "Update")
        .then(installIfAccepted);
}

// checkCommandInstalled checks if the MemeAssembly compiler is installed.
// If not, the user will be prompted to install it.
// If the compiler is installed, it will check if it's the latest version from GitHub.
//  > If a newer version is available, the user will be prompted to update.
//  > If no newer version is available AND showNoUpdate is true, a message will show that no update is available
export function checkCommandInstalled(showNoUpdate?: boolean) {
    // We just execute the help command. If it's installed, we'll get the current version number
    exec("memeasm --help",
        async function (error: ExecException | null, stdout: string, stderr: string) {
            if (error) {
                await vscode.window
                    .showWarningMessage("The MemeAssembly Compiler is not installed.", "Install")
                    .then(installIfAccepted);

                return;
            }

            // Extract the version number from the help output (basically anything starting with v and a number)
            let versionRegex = new RegExp(/(v(?:\d\.?)+)/i);
            let versionMatch = versionRegex.exec(stdout);
            if (versionMatch == null || versionMatch.length === 0 || versionMatch[0].trim().length === 0) {
                return;
            }

            let installedVersionNumber = versionMatch[0].trim();

            await checkForUpdate(installedVersionNumber, showNoUpdate);
        }
    );
}
