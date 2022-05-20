import path = require('path');
import * as vscode from 'vscode';
import { Definition, DefinitionFinder } from '../util/definition_finder';
import shellescape = require('shell-escape');

export async function runCurrentFile(textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, ...args: any[]) {
    try {
        // Make sure we save all files before running
        vscode.workspace.textDocuments.forEach(async doc => {
            if (doc.languageId == 'memeasm' && !doc.isUntitled) {
                await doc.save();
            }
        });

        // At first we want to know which files are required for compiling the current file.
        // For that we take a look at which functions are defined at which places
        var defs = await (new DefinitionFinder("function_name:def", false)).findAllDefinitions(textEditor.document, null);

        // Then we take a look at what is referenced
        var requiredFiles = await (new DefinitionFinder("function_name:ref", true))
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

        // Check if any of the referenced files reads input
        let readsInput : boolean = false;
        let readDefinitionFinder = new DefinitionFinder("io:read", false);
        for (let file of requiredFiles) {
            let realPath = path.join(
                path.dirname(textEditor.document.uri.fsPath),
                file
            )
            let defs = await readDefinitionFinder.fromFile(undefined, realPath)
            if (defs.length > 0 ) {
                readsInput = true;
                break;
            }
        }

        // If the program reads input, we want to focus the terminal; else we don't focus it
        // That way we keep the cursor in the text editor, which is just faster when you want to change something
        term.show(!readsInput);

        const targetExecutable = "./main";
        term.sendText(shellescape(["memeasm", "-o", targetExecutable, ...requiredFiles]) + " && " + targetExecutable);

    } catch (e: any) {
        await vscode.window.showErrorMessage(e.toString());
    }
}
