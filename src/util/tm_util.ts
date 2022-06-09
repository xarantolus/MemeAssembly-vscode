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

// languageGrammar is our grammar file that defines basically everything
const languageGrammar = require('../../syntaxes/memeasm.tmLanguage.json')

export function loadAvailableCommands() {
    if (cmds != null) {
        return cmds!;
    }

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


export function getCommandsByRef(ref: string): Array<CommandInfo> {
    return loadAvailableCommands().filter(c => (c as any)["ref"] == ref);
}

export function getCommandsByFormattingGuideline(fmt: string): Array<CommandInfo> {
    return loadAvailableCommands().filter(c => (c as any)["format"] == fmt);
}

export class FormattingCombination {
    public id: string;

    public start: CommandInfo;
    public end: CommandInfo;

    public exactMatchRequired: boolean;

    constructor(_id: string, _start: CommandInfo, _end: CommandInfo, exact?: boolean) {
        this.id = _id;
        this.start = _start;
        this.end = _end;
        this.exactMatchRequired = exact ?? true;
    }
}


export function getCommandCombo(tag: string, exact?: boolean): FormattingCombination {
    let cmds = getCommandsByFormattingGuideline("combo").filter(c => (c as any)["tag"].startsWith(tag));
    if (cmds.length != 2) {
        throw new Error("Formatting combination for " + tag + " has length " + cmds.length + ", but expected length 2")
    }

    let start = cmds.find(c => (c as any)["tag"].endsWith('_start'));
    let end = cmds.find(c => (c as any)["tag"].endsWith('_end'));

    if (start == null)
        throw new Error("Formatting combination " + tag + " has no start!");
    if (end == null)
        throw new Error("Formatting combination " + tag + " has no end!");

    return new FormattingCombination(tag, start, end, exact);
}


export function getLoopCombinations(): FormattingCombination[] {
    return [
        getCommandCombo("upgrade_loop"),
        getCommandCombo("banana_loop"),
        getCommandCombo("monke_loop")
    ]
}

export function getCommandCombinations(): FormattingCombination[] {
    return [
        ...getLoopCombinations(),
        getCommandCombo("corporate_comparison", false)
    ]
}


export function matchesLine(cmds: CommandInfo[], line: string): string | boolean {
    for (let pattern of cmds) {
        var regex = new RegExp(pattern.match, "g")

        var match: RegExpExecArray | null = null;
        while (null != (match = regex.exec(line))) {
            return match[1] || true;
        }
    }

    return false;
}


export function getRegisterRegexes(): string[] {
    let repo = languageGrammar["repository"];
    const registerKeys = ["64bit-registers", "32bit-registers", "16bit-registers", "8bit-registers"];

    let result: string[] = [];
    for (const key of registerKeys) {
        let patterns = repo[key]["patterns"] as Array<any>;
        result.push(...patterns.map(p => p["match"]).filter(e => e));
    }
    return result;
}
