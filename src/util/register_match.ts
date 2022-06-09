import * as vscode from 'vscode';

import { getRegisterRegexes } from './tm_util';

export class RegisterFinder {
    private registerMatchers: string[];

    constructor() {
        this.registerMatchers = getRegisterRegexes().map(r => r.startsWith("(?i)") ? r.substring(4) : r)
    }

    public isValidRegisterString(register: string): boolean {
        return this.registerMatchers.some(r => new RegExp(r, "ig").test(register));
    }

    public findRegisters(line: string, lineNumber: number): vscode.Range[] {
        let results: vscode.Range[] = [];
        for (let pattern of this.registerMatchers) {
            let regex = new RegExp(pattern, "ig")

            var match: RegExpExecArray | null = null;
            while (null != (match = regex.exec(line))) {
                let resRange = new vscode.Range(
                    new vscode.Position(lineNumber, match.index),
                    new vscode.Position(lineNumber,
                        match.index + (match[0]?.length ?? 0)
                    ),
                );
                results.push(resRange);
            }
        }

        return results;
    }
}
