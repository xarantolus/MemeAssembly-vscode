import path = require('path');
import * as vscode from 'vscode';
import { forEachLine } from './files';
import { CommandInfo, getCommandsByRef } from './tm_util';

export class Definition {
    public customName: string;

    public location: vscode.Location;

    public command : CommandInfo;

    constructor(_functionName: string, _location: vscode.Location, _command: CommandInfo) {
        this.customName = _functionName;
        this.location = _location;
        this.command = _command;
    }
}

export class DefinitionFinder {
    private definitions: Array<CommandInfo>;

    // start defines whether the definition should point to the start or the end of the referenced line
    private start: boolean;

    public constructor(ref: string, startOfString: boolean) {
        this.definitions = ref ? getCommandsByRef(ref) : [];
        this.start = startOfString;
    }

    static withDefinitions(defs: Array<CommandInfo>, startOfString: boolean): DefinitionFinder {
        var d = new DefinitionFinder("", startOfString);
        d.definitions = defs;
        return d;
    }

    private pathEquals(path1: string, path2: string): boolean {
        path1 = path.resolve(path1);
        path2 = path.resolve(path2);
        if (process.platform == "win32")
            return path1.toLowerCase() === path2.toLowerCase();
        return path1 === path2
    }

    private async extractDefinitionsFromFile(documentPath: string | vscode.TextDocument): Promise<Array<Definition>> {
        let defs: Array<Definition> = [];

        let lineIndex = 0;

        // If we already have this file opened, we want to use the content that is present
        // in that file. E.g. if there are unsaved changes, we will do the right thing
        if (typeof documentPath === 'string') {
            let openedDocument = vscode.workspace.textDocuments.find((document) => {
                return this.pathEquals(document.uri.fsPath, documentPath as string);
            })

            if (openedDocument) {
                documentPath = openedDocument;
            }
        }

        // We still need to handle the case where we cannot get the document
        if (typeof documentPath === 'string') {
            await forEachLine(documentPath, (line) => {
                let def = this.matchLine(documentPath as string, line, lineIndex++);
                if (def) {
                    defs.push(def);
                }
            });
        } else {
            for (let lineIdx = 0; lineIdx < documentPath.lineCount; lineIdx++) {
                let def = this.matchLine(documentPath.uri.fsPath,
                    documentPath.lineAt(lineIdx).text, lineIdx)
                if (def) {
                    defs.push(def);
                }
            }
        }

        return defs;
    }

    public async fromFile(document?: vscode.TextDocument, path?: string): Promise<Array<Definition>> {
        return await this.extractDefinitionsFromFile(document ?? path!);
    }

    public matchSingleLine(document: vscode.TextDocument, lineNumber: number): Definition | null {
        return this.matchLine(document.uri.fsPath, document.lineAt(lineNumber).text, lineNumber);
    }

    // matchLine returns either a Definition for the command in the given line, or null
    private matchLine(filePath: string, currentLine: string, lineNumber: number): Definition | null {
        for (let pattern of this.definitions) {
            let regex = new RegExp(pattern.match, "g")

            let match: RegExpExecArray | null = null;
            while (null != (match = regex.exec(currentLine))) {
                let start = new vscode.Position(
                    lineNumber,
                    match.index + (this.start ? 0 : ((match[0]?.length ?? 0) - (match[1]?.length ?? 0)))
                );
                if (match.length >= 2) {
                    let matchAtStart = match[0].startsWith(match[1]);
                    if (matchAtStart) {
                        start = new vscode.Position(
                            lineNumber,
                            match.index
                        );
                    } else {
                        start = new vscode.Position(
                            lineNumber,
                            match.index + (match[0].length - match[1].length)
                        );
                    }
                }

                // Basically convert the regex match to something we can work with
                return new Definition(
                    match[1] ?? '',
                    new vscode.Location(
                        vscode.Uri.file(filePath),
                        new vscode.Range(start, start.with(undefined, start.character + (match[1]?.length ?? 0)))
                    ),
                    pattern,
                );
            }
        }

        return null;
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

            if (resultPaths.includes(currentPath)) {
                continue
            }
            resultPaths.push(currentPath);

            // Which functions are called from this file?
            let refs = await this.extractDefinitionsFromFile(currentPath);

            // Where can we find these functions in
            //  - preferably the already selected paths
            //  - any other workspace file
            let defs = refs.flatMap(ref => {
                let candidates = availableDefinitions.filter(def => def.customName == ref.customName);

                let direct = candidates.find(c => resultPaths.includes(c.location.uri.fsPath));
                if (direct) return [direct];

                return candidates;
            })

            // ... and add the referenced files to the stuff we want to look into
            paths.push(...defs.map(d => d.location.uri.fsPath));
        }

        return resultPaths.map(p => path.relative(shellDir, p));
    }

    public async findAllDefinitions(document: vscode.TextDocument, token: vscode.CancellationToken | null): Promise<Array<Definition>> {
        let workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if (!workspaceFolder || document.isUntitled) {
            throw "This command only works when the file is in your workspace directory.";
        }

        let memeasmPattern = new vscode.RelativePattern(workspaceFolder.uri.path, '**/*.memeasm');

        let results = await vscode.workspace.findFiles(memeasmPattern, null, 1000);


        var definitions = [];
        for await (const file of results) {
            if (token?.isCancellationRequested) break;

            var defs = await this.extractDefinitionsFromFile(file.fsPath);

            definitions.push(...defs);
        }

        return definitions;
    }
}
