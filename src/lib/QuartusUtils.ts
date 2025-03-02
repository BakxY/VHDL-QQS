import * as vscode from 'vscode';
import * as path from 'path'
import * as fs from 'fs';
import { resolvePathWithWildcards } from './PathUtils';

/**
 * @brief Gets all quartus project files (file extension .qpf) in the current workspace
 * 
 * @returns An array of all quartus project files
 */
export function getAllProjectFiles() {
    const allFiles: string[] = resolvePathWithWildcards(path.normalize('**/*'));
    let allProjectFiles: string[] = [];

    for (let fileIndex = 0; fileIndex < allFiles.length; fileIndex++) {
        if (path.extname(allFiles[fileIndex]) == '.qpf') {
            allProjectFiles.push(allFiles[fileIndex].replace(vscode.workspace.workspaceFolders![0].uri.fsPath, '').replaceAll('\\', '/'));
        }
    }

    return allProjectFiles;
}

/**
 * @brief Checks a path for files common for a quartus installation
 * 
 * @param pathToQuartus The installation path to check
 * 
 * @returns A boolean type, true if common files are present, else false
 */
export function checkForQuartusInstallation(pathToQuartus: string) {
    if (!fs.existsSync(pathToQuartus)) {
        return false;
    }

    const allQuartusFiles: string[] = fs.readdirSync(pathToQuartus);

    if (process.platform == 'win32') {
        if (!allQuartusFiles.includes('quartus_sh.exe')) {
            return false;
        }

        if (!allQuartusFiles.includes('quartus_pgmw.exe')) {
            return false;
        }
    }
    else {
        if (!allQuartusFiles.includes('quartus_sh')) {
            return false;
        }

        if (!allQuartusFiles.includes('quartus_pgmw')) {
            return false;
        }
    }

    return true;
}