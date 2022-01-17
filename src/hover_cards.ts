import * as vscode from 'vscode';
import { Hover } from 'vscode';

class CommandInfo {
    public name: string
    public match: string
    public hoverText: string

    constructor(_name: string, _match: string, _hoverText: string) {
        this.name = _name;
        this.hoverText = _hoverText;

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
        var mainCommands = repo["commands"]["patterns"] as Array<{
            include: string
        }>;

        // We need to make sure that "additions" is first because they take precedence
        var commandCategories = ["additions", ...mainCommands.map(x => x.include.replace(/#/, ''))]

        var allCommands: Array<CommandInfo> = [];

        commandCategories.forEach(cmd => {
            var patterns = repo[cmd]["patterns"] as Array<CommandInfo>;

            patterns.forEach(pattern => {
                if (pattern.match) {
                    if (!pattern.hoverText) {
                        console.warn(`Command with pattern ${pattern.match} doesn't provide a hover text`)
                    }
                    allCommands.push(pattern);
                }
            })
        })

        this.patterns = allCommands;
    }

    readonly pointerEndText = " do you know de wey"

    private matchLine(line: string): CommandResult | null {
        var res: CommandResult | null = null;

        var oldLength = line.length;
        line = line.trimStart()
        var trimmedFromStart = oldLength - line.length;

        // Basically, we try to check if this line has a command in it.
        // If yes, we want to generate a hover text
        for (const pattern of this.patterns) {

            var regex = new RegExp(pattern.match, "g")

            var match = regex.exec(line);
            if (!match) {
                // The line does not have this command
                continue;
            }

            // We do have a command in the line. We now get its hover text description
            // and replace certain variables
            // Variables:
            //  $1, $2, ...:    These just stand for the first, second etc. matched group of the regex
            //  $1:a, $2:a,...: This is for ASCII characters. They are replaced with a description of the character
            var itxt: string = pattern.hoverText;

            for (let idx = 1; idx < match.length; idx++) {
                const submatch = match[idx];

                // TODO: This is quite ugly. It would be nicer to have a "hoverFunc" property 
                // on a capture that defines which function should be used to analyze the match.

                if (submatch.endsWith(this.pointerEndText)) {
                    // The text for pointers should remove the "do you know de wey" part
                    itxt = itxt.replace("$" + idx + ":a", "$" + idx);
                    itxt = itxt.replace("$" + idx, "**" + submatch.substring(0, submatch.length - this.pointerEndText.length).trim() + " interpreted as pointer**");
                } else {
                    // ASCII characters for the "what can I say except" command (and only there)
                    itxt = itxt.replace("$" + idx + ":a", "**" + this.character_text(submatch.trim()) + "**");

                    itxt = itxt.replace("$" + idx, "**" + submatch.trim() + "**");
                }
            }


            res = new CommandResult(
                pattern,
                trimmedFromStart + match.index,
                trimmedFromStart + match.index + match[0].length,
                itxt);

            break;
        }

        return res;
    }

    escape_sequences = new Map([
        ["\\n", "Newline"],
        ["\\s", "Space"],
        ["space", "Space"],
        ["\\t", "Tab"],
        ["\\f", "Form feed"],
        ["\\b", "Backspace"],
        ["\\v", "Vertical tab"],
        ["\\\"", "Double quote"],
        ["\\?", "Question mark"],
        ["\\\\", "Backslash"],
    ]);

    sequences = new Map([
        ["\n", "Newline"],
        [" ", "Space"],
        ["\t", "Tab"],
        ["\f", "Form feed"],
        ["\b", "Backspace"],
        ["\v", "Vertical tab"],
        ["\\", "Backslash"],
    ]);

    character_text(match: string): string {
        if (match.length == 1) {
            return match + " (" + match.charCodeAt(0).toString() + ")"
        }

        var desc = this.escape_sequences.get(match);
        if (desc) {
            return desc;
        }

        var asInt = parseInt(match);
        if (asInt && asInt >= 0x20 && asInt <= 0x7e) {
            var str = String.fromCharCode(asInt);

            desc = this.sequences.get(str);
            if (desc) {
                str = desc;
            }
            return str + " (" + asInt.toString() + ")";
        }


        return match;
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
