import path = require('path');
import * as vscode from 'vscode';
import shellescape = require('shell-escape');
import { DefinitionFinder } from '../util/functions';

export async function runCurrentFile(textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, ...args: any[]) {

    // Make sure we save all files before running
    vscode.workspace.textDocuments.forEach(async doc => {
        if (doc.languageId == 'memeasm' && !doc.isUntitled) {
            await doc.save();
        }
    });

    // At first we want to know which files are required for compiling the current file.
    // For that we take a look at which functions are defined at which places
    var defs = await (new DefinitionFinder("function_name:def")).findAllDefinitions(textEditor.document, null);

    // Then we take a look at what is referenced
    var requiredFiles = await (new DefinitionFinder("function_name:ref"))
        .resolveReferencedFiles(textEditor.document, textEditor.document.uri.fsPath, defs);

    // Set up the directory where the compiler and executable will run
    var mainFilePath = textEditor.document.fileName;
    var shellDir = path.dirname(mainFilePath);


    // Find or create terminal
    const termName = "MemeAssembly";
    var term = vscode.window.terminals.find(t => t.name == termName) || vscode.window.createTerminal(termName);

    // cd to current path, but clear that "cd" instantly
    term.sendText(shellescape(["cd", shellDir]));
    term.sendText("clear");

    // Very basic check on whether the file reads input; of course there could be reads in other files
    var readsInput = textEditor.document.getText().includes("let me in. LET ME IIIIIIIIN")

    // If the program reads input, we want to focus the terminal; else we don't focus it
    // That way we keep the cursor in the text editor, which is just faster when you want to change something
    term.show(!readsInput);

    const targetExecutable = "./main";
    term.sendText(shellescape(["memeasm", "-o", targetExecutable, ...requiredFiles]) + " && " + targetExecutable);
}
