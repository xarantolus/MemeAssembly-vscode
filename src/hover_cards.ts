import * as vscode from 'vscode';
import { Hover } from 'vscode';

class CommandInfo {
    public name: string
    public match: string
    public comment: string

    constructor(_name: string, _match: string, _comment: string) {
        this.name = _name;
        this.comment = _comment;

        this.match = _match;
    }
}



class CommandResult {
    public info: CommandInfo

    public startPos: number
    public endPos: number

    public infoText: string;

    constructor(_info: CommandInfo, _start: number, _end: number, _infoText: string) {
        this.info = _info;
        this.startPos = _start;
        this.endPos = _end;
        this.infoText = _infoText;
    }
}

const languageGrammar = require('../syntaxes/memeasm.tmLanguage.json')

export class HoverProvider implements vscode.HoverProvider {
    private patterns: Array<CommandInfo>

    constructor() {
        // Load all patterns from the tmlanguage file
        var repo = languageGrammar["repository"];
        var commandMeta = repo["commands"]["patterns"] as Array<{
            include: string
        }>;

        var allCommands: Array<CommandInfo> = [];

        commandMeta.forEach(cmd => {
            var patterns = repo[cmd.include.replace(/#/, '')]["patterns"] as Array<CommandInfo>;

            patterns.forEach(pattern => {
                if (pattern.match) {
                    allCommands.push(pattern);
                }
            })
        })

        this.patterns = allCommands;
    }

    private matchLine(line: string): CommandResult | null {
        var res: CommandResult | null = null;

        for (const pattern of this.patterns) {

            var regex = new RegExp(pattern.match, "g")

            var match = regex.exec(line);
            if (!match) {
                continue;
            }

            var itxt : string = pattern.comment;

            for (let idx = 1; idx < match.length; idx++) {
                const submatch = match[idx];

                itxt = itxt.replace("$" + idx, submatch.trim());
            }


            res = new CommandResult(pattern,
                match.index, match.index + match[0].length, itxt);

            break;
        }

        return res;
    }


    provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
        var line = document.lineAt(position.line);
        if (line.isEmptyOrWhitespace) {
            return;
        }

        var match = this.matchLine(line.text);
        if (!match) {
            return;
        }


        var tokenRange = new vscode.Range(
            new vscode.Position(position.line, match.startPos),
            new vscode.Position(position.line, match.endPos));

        return new Hover(match.infoText, tokenRange);
    }
}
