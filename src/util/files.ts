import path = require("path");
import { Definition } from "./functions";
import fs = require('fs');
import readline = require('readline');


export function forEachLine(inputFileName: string, callback: (input: string) => void) {
    return new Promise((resolve, reject) => {
        const rl = readline.createInterface({
            input: fs.createReadStream(inputFileName)
        });

        rl.on('line', callback)
        rl.on('close', resolve)
        rl.on('error', reject);
    });
}

export function uniqueRelativePaths(refs: Array<Definition>, shellDir: string) {
    var relativePaths = refs.map(d => path.relative(shellDir, d.location.uri.fsPath));
    return [...new Set(relativePaths)];
}
