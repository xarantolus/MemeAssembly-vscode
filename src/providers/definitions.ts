import * as vscode from 'vscode';
import { Definition, DefinitionFinder } from '../util/definition_finder';
import { CommandInfo, FormattingCombination, getCommandCombinations, getCommandsByRef, matchesLine } from '../util/tm_util';


export class FunctionDefinitionProvider implements vscode.DefinitionProvider {
    private references: Array<CommandInfo>;

    constructor() {
        this.references = getCommandsByRef("function_name:ref");
    }

    async provideDefinition(
        document: vscode.TextDocument, position: vscode.Position,
        token: vscode.CancellationToken,
    ): Promise<vscode.Location[]> {
        var currentLine = document.lineAt(position);

        let needleFunctionName: string | null = null;
        for (let pattern of this.references) {
            var regex = new RegExp(pattern.match, "g")
            var match = regex.exec(currentLine.text);
            if (!match) {
                continue;
            }

            needleFunctionName = match[1];
        }
        if (!needleFunctionName) return [];

        await document.save()

        // Now we search all workspace MemeAssembly files for function definitions
        var defs = await (new DefinitionFinder("function_name:def", false)).findAllDefinitions(document, token);

        return defs
            .filter(def => def.customName === needleFunctionName)
            .map(def => def.location);
    }
}


export class LoopDefinitionProvider implements vscode.DefinitionProvider {
    private combos: FormattingCombination[];

    private startFinder: DefinitionFinder;
    private endFinder: DefinitionFinder;

    constructor() {
        this.combos = getCommandCombinations();
        this.startFinder = DefinitionFinder.withDefinitions(
            this.combos.map(c => c.start),
            true
        )
        this.endFinder = DefinitionFinder.withDefinitions(
            this.combos.map(c => c.end),
            true
        )
    }

    async provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Location[]> {
        let findMatch = (firstDef: Definition, start: boolean) => {
            let defLine = firstDef.location.range.start.line;
            for (const cmb of this.combos) {
                let startSymbol = matchesLine([start ? cmb.start : cmb.end], document.lineAt(defLine).text);
                if (!startSymbol) {
                    continue
                }

                for (let lidx = 0; lidx < document.lineCount; lidx++) {
                    if (lidx == defLine) continue;
                    const line = document.lineAt(lidx);

                    let m2 = matchesLine([start ? cmb.end : cmb.start], line.text);
                    if (cmb.exactMatchRequired && m2 == startSymbol ||
                        !cmb.exactMatchRequired && m2) {
                        return [
                            new vscode.Location(
                                document.uri,
                                new vscode.Position(
                                    lidx, line.firstNonWhitespaceCharacterIndex
                                )
                            )
                        ]
                    }

                }
            }
            return [];
        }

        try {
            let startDefs = await this.startFinder.fromFile(document);
            let endDefs = await this.endFinder.fromFile(document);

            let ed = endDefs.find(l => l.location.range.start.line == position.line);
            if (ed) {
                // Now find the matching start definition
                return findMatch(ed, false);
            }

            let sd = startDefs.find(l => l.location.range.start.line == position.line);
            if (sd) {
                // Now find the matching end definition
                return findMatch(sd, true);
            }

        } catch (e: any) {
            console.log("Error:", e);
        }


        return [];
    }
}
