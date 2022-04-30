import path = require('path');
import * as vscode from 'vscode';
import { forEachLine } from './files';
import { CommandInfo, getCommandsByRef } from './tm_util';

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

    // start defines whether the definition should point to the start or the end of the referenced line
    private start: boolean;

    constructor(ref: string, startOfString: boolean) {
        this.definitions = getCommandsByRef(ref);
        this.start = startOfString;
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
                let start = new vscode.Position(lineNumber, match.index + (this.start ? 0 : (match[0].length - match[1].length)));

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

    public async resolveReferencedFiles(document: vscode.TextDocument, filePath: string, availableDefinitions: Array<Definition>): Promise<Array<string>> {
        let workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if (!workspaceFolder || document.isUntitled) {
            throw "Cannot get workspace folder";
        }

        var resultPaths: Array<string> = [];

        var shellDir = path.dirname(filePath);

        var paths = [filePath];
        while (paths.length > 0) {
            var currentPath = paths.pop()!;

            // This is already a result path
            var rel = path.relative(shellDir, currentPath);
            if (resultPaths.includes(rel)) {
                continue
            }
            resultPaths.push(rel);

            // Which functions are called from this file?
            var refs = await this.extractDefinitionsFromFile(workspaceFolder.uri, currentPath);

            // Where can we find these functions in the current workspace?
            var defs = availableDefinitions
                .filter(d => refs.some(r => r.functionName === d.functionName))

            // ... and add the referenced files to the stuff we want to look into
            paths.push(...defs.map(d => d.location.uri.fsPath));
        }

        return resultPaths;
    }

    public async findAllDefinitions(document: vscode.TextDocument, token: vscode.CancellationToken | null): Promise<Array<Definition>> {
        let workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if (!workspaceFolder || document.isUntitled) {
            throw "This command only works when the file is in your workspace directory.";
        }

        let memeasmPattern = new vscode.RelativePattern(workspaceFolder.uri.path, '**/*.memeasm');

        let results = await vscode.workspace.findFiles(memeasmPattern, null, 100);

        var definitions = [];
        for await (const file of results) {
            if (token?.isCancellationRequested) break;

            var defs = await this.extractDefinitionsFromFile(workspaceFolder.uri, file.fsPath);

            definitions.push(...defs);
        }

        return definitions;
    }
}
