// CommandInfo represents a pattern from the syntax JSON file.
// Each command has a
//  - name: for theming extensions
//  - match: a Regex pattern to check if a text is that command
//  - hoverText: a text to show when hovering over a command
export class CommandInfo {
    public name: string
    public match: string
    public hoverText: string

    constructor(_name: string, _match: string, _hoverText: string) {
        this.name = _name;
        this.hoverText = _hoverText;

        this.match = _match;
    }
}

var cmds: Array<CommandInfo> | null = null;

export function loadAvailableCommands() {
    if (cmds != null) {
        return cmds!;
    }
    // languageGrammar is our grammar file that defines basically everything
    const languageGrammar = require('../../syntaxes/memeasm.tmLanguage.json')

    // Load all patterns from the tmlanguage file
    var repo = languageGrammar["repository"];
    var mainCommands = repo["commands"]["patterns"] as Array<{ include: string }>;

    // We need to make sure that "additions" is first because they take precedence
    var commandCategories = ["additions", ...mainCommands.map(x => x.include.replace(/#/, ''))]

    // Now we load all known command patterns
    cmds = commandCategories.flatMap(cmd => {
        var patterns = repo[cmd]["patterns"] as Array<CommandInfo>;

        return patterns.filter(p => p.match).map(
            pattern => {
                if (!pattern.hoverText) {
                    console.warn(`Command with pattern ${pattern.match} doesn't provide a hover text`)
                }

                return pattern;
            },
        );
    });

    return cmds;
}


export function getCommandsByRef(ref: string) : Array<CommandInfo> {
    return loadAvailableCommands().filter(c => (c as any)["ref"] == ref);
}
