import { assert } from 'console';
import * as vscode from 'vscode';

const printPrefix = "what can I say except ";
const commentPrefix = "What the hell happened here? "
function singleCharToCommand(c: string, partOfEmoji: boolean): string {
    assert(c.length === 1);

    if (!partOfEmoji) {
        if (c == ' ')
            return printPrefix + 'space';
        if (c == '\n')
            return printPrefix + '\\n'
    }

    let cc = c.charCodeAt(0);
    assert(cc >= 0 && cc <= 255);

    // Printable characters are ok
    if (!partOfEmoji && cc > 32 && cc <= 126) {
        return printPrefix + c;
    }

    return printPrefix + cc.toString(10);
}


function characterToCommands(c: string): Array<string> {
    if (c.length == 1 && c.charCodeAt(0) <= 255)
        return [singleCharToCommand(c, false)]


    return [
        commentPrefix + `Print '${c}' to the console`,
        ...[...Buffer.from(c)].map((c) =>
            singleCharToCommand(String.fromCharCode(c), true)
        )
    ];
}

function toCommands(text: string): Array<string> {
    return [...text].map(characterToCommands).flat();
}


export async function insertPrintCommands() {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        return;
    }

    let clipboard = await vscode.env.clipboard.readText()

    let inputText = await vscode.window.showInputBox({
        prompt: 'Type text or press enter to paste from clipboard',
        placeHolder: clipboard,
    });
    // If the user presses escape, we will just stop
    if (inputText === undefined) {
        return;
    }
    if (!inputText) {
        inputText = clipboard;
        if (!inputText) {
            return;
        }
    }

    const indent = activeEditor.selection.active;

    let txt = activeEditor.document.getText(
        new vscode.Range(
            indent.with(undefined, 0),
            indent,
        ),
    );

    // Get the spaces before the current line
    let indentText = '';
    let prefixArray = (new RegExp(/^\s+/)).exec(txt);
    if (prefixArray && prefixArray.length > 0) {
        indentText = prefixArray![0];
    }

    let commands = toCommands(inputText!.replace('\r', '') + (inputText.endsWith('\n') ? '' : '\n'))
    if (commands.length === 0) {
        return;
    }

    let outputText = commands[0] + '\n';
    for (let i = 1; i < commands.length; i++) {
        outputText += indentText + commands[i] + '\n';
    }


    await activeEditor.edit(function (editBuilder: vscode.TextEditorEdit) {
        editBuilder.insert(indent, outputText);
    })
}
