import * as vscode from 'vscode';
import * as path from 'path'
import * as fs from 'fs';
import * as cp from 'child_process';
import * as readline from 'readline';
import { resolvePathWithWildcards } from './PathUtils';

export type globalAssignment = {
    name: string;
    value: string;
}

export type locationAssignment = {
    source: string;
    target: string;
}

export type instanceAssignment = {
    name: string;
    sourceFile: string;
    destination: string;
    selectionId: string;
}

export type qsfContent = {
    globals: globalAssignment[];
    locations: locationAssignment[];
    instances: instanceAssignment[];
}

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

/**
 * @brief Parses a string read from a psf file into a data structure
 * 
 * @param qsfContent The content of a qsf file, read from the fs
 * 
 * @returns The data structure containing the data of the qsf data
 */
export function getProjectGlobal(name: string) {
    const commandOutput = cp.execSync('quartus_sh -t "c:/Users/Severin Sprenger/Documents/Git/zhaw-et24-pm2/synthi_top/openProject.tcl"', { encoding: 'utf8' }).split('\n');

    let filteredCommandOutput: string[] = []

    for(let currentLine = 0; currentLine < commandOutput.length; currentLine++)
    {
        if(!commandOutput[currentLine].trim().startsWith('Info'))
        {
            filteredCommandOutput.push(commandOutput[currentLine].trim())
        }
    }
}