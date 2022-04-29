import fs = require('fs');
import path = require('path');
import * as vscode from 'vscode';
import { CommandInfo, getCommandsByRef } from './tm_util';
import readline = require('readline');

export class Definition {
    public functionName: string;

    public location: vscode.Location;

    constructor(_functionName: string, _location: vscode.Location) {
        this.functionName = _functionName;
        this.location = _location;
    }
}

export class DefinitionFinder {
    private definitions: Array<CommandInfo>;

    constructor(ref: string) {
        this.definitions = getCommandsByRef(ref);
    }

    private async extractDefinitionsFromFile(workspace: vscode.Uri, path: string): Promise<Array<Definition>> {
        var definitions: Array<Definition> = [];

        var lineIndex = 0;

        await forEachLine(path, (line) => {
            let def = this.matchLine(workspace, path, line, lineIndex++);
            if (def) {
                definitions.push(def);
            }
        })

        return definitions;
    }

    // matchLine returns either a Definition for the command in the given line, or null
    private matchLine(workspace: vscode.Uri, filePath: string, currentLine: string, lineNumber: number): Definition | null {
        var result: Definition | null = null;

        for (let pattern of this.definitions) {
            var regex = new RegExp(pattern.match, "g")

            var match: RegExpExecArray | null = null;
            while (null != (match = regex.exec(currentLine))) {
                let start = new vscode.Position(lineNumber, match.index + match[0].length - match[1].length);

                // Basically convert the regex match to something we can work with
                result = new Definition(
                    match[1],
                    new vscode.Location(
                        vscode.Uri.joinPath(workspace, path.relative(workspace.path, filePath)),
                        new vscode.Range(start, start.with(undefined, start.character + match[1].length))
                    ),
                );
            }
        }

        return result;
    }

    public async findAllDefinitions(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<Array<Definition>> {
        let workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if (!workspaceFolder || document.isUntitled) {
            throw "Cannot get workspace folder";
        }

        let memeasmPattern = new vscode.RelativePattern(workspaceFolder.uri.path, '**/*.memeasm');

        let results = await vscode.workspace.findFiles(memeasmPattern, null, 100);

        var definitions = [];
        for await (const file of results) {
            if (token.isCancellationRequested) break;

            var defs = await this.extractDefinitionsFromFile(workspaceFolder.uri, file.fsPath);

            definitions.push(...defs);
        }

        return definitions;
    }
}


function forEachLine(inputFileName: string, callback: (input: string) => void) {
    return new Promise((resolve, reject) => {
        const rl = readline.createInterface({
            input: fs.createReadStream(inputFileName)
        });

        rl.on('line', callback)
        rl.on('close', resolve)
        rl.on('error', reject);
    });
}
