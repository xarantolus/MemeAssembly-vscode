import path = require('path');
import * as vscode from 'vscode';
import shellescape = require('shell-escape');

export async function runCurrentFile(textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, ...args: any[]) {
    var targetFilePath = textEditor.document.fileName;

    // Make sure we save before running
    await textEditor.document.save();

    var readsInput = textEditor.document.getText().includes("let me in. LET ME IIIIIIIIN")

    const termName = "MemeAssembly";

    // Find or create terminal
    var term = vscode.window.terminals.find(t => t.name == termName)
        || vscode.window.createTerminal(termName);

    // cd to current path
    term.sendText(shellescape(["cd", path.dirname(targetFilePath)]));

    // clear previous command
    term.sendText("clear");

    // If the command reads input, we want to focus the terminal; else we don't focus it
    // That way we keep the cursor in the text editor, which is just faster when you want to change something
    term.show(!readsInput);

    const targetExecutable = "./main";
    term.sendText(shellescape(["memeasm", "-o", targetExecutable, path.basename(targetFilePath)]) + " && " + targetExecutable);
}
