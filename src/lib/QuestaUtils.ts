import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as pathUtils from './PathUtils';
import { outputChannel } from '../extension';

/**
 * @brief Gets all questa project files (file extension .qpf) in the current workspace
 * 
 * @returns An array of all questa project files
 */
export function getAllProjectFiles() {
    const allFiles: string[] = pathUtils.resolvePathWithWildcards(path.normalize('**/*'));
    let allProjectFiles: string[] = [];

    // Check all files for project file extension
    for (let fileIndex = 0; fileIndex < allFiles.length; fileIndex++) {
        if (path.extname(allFiles[fileIndex]) === '.mpf') {
            allProjectFiles.push(allFiles[fileIndex].replace(vscode.workspace.workspaceFolders![0].uri.fsPath, '').replaceAll('\\', '/'));
        }
    }

    return allProjectFiles;
}

/**
 * @brief Checks a path for files common for a questa installation
 * 
 * @param pathToQuesta The installation path to check
 * 
 * @returns A boolean type, true if common files are present, else false
 */
export function checkForQuestaInstallation(pathToQuesta: string) {
    // Check if bin path exists
    if (!fs.existsSync(pathToQuesta)) { return false; }

    // Read all files in folder
    const allQuestaFiles: string[] = fs.readdirSync(pathToQuesta);

    // Check what platform is running
    if (process.platform === 'win32') {
        // Check of required questa files
        if (!allQuestaFiles.includes('vsim.exe')) {
            return false;
        }
    }
    else {
        // Check of required questa files
        if (!allQuestaFiles.includes('vsim')) {
            return false;
        }
    }

    return true;
}