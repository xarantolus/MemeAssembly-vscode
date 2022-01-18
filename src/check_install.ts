import * as vscode from 'vscode';
import { platform, version } from 'os';
import { exec, ExecException } from 'child_process';
import path = require('path');
import { Octokit } from "@octokit/rest";


export function installMemeAssembly() {
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
    exec("memeasm --help", async (error: ExecException | null, stdout: string, stderr: string) => {
        if (error) {
            vscode.window
                .showWarningMessage("The MemeAssembly Compiler is not installed.", "Install")
                .then(userAccepted => {
                    // If the user didn't click the "Install" button
                    if (!userAccepted) {
                        return;
                    }

                    installMemeAssembly();
                });
        } else {
            // Extract the version number from the help output
            let versionRegex = new RegExp(/(v(?:\d\.?)+)/i);
            let versionMatch = versionRegex.exec(stdout);
            if (versionMatch == null || versionMatch.length === 0 || versionMatch[0].trim().length === 0) {
                return;
            }

            let installedVersionNumber = versionMatch[0].trim();

            let githubAPI = new Octokit();

            // Get the latest release from GitHub
            var latestReleases = await githubAPI.repos.listReleases({
                owner: "kammt",
                repo: "MemeAssembly",
                per_page: 1
            });

            let latestRelease = latestReleases.data[0];

            if (installedVersionNumber == latestRelease.tag_name) {
                // Latest version installed
                return;
            }

            console.log("new version available");
        }
    });
}
