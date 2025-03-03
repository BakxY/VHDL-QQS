import * as vscode from 'vscode';
import * as path from 'path'
import * as fs from 'fs';
import * as cp from 'child_process';
import * as pathUtils from './PathUtils';

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
    const allFiles: string[] = pathUtils.resolvePathWithWildcards(path.normalize('**/*'));
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
 * @brief Get a global assignment for the currently active project
 * 
 * @param context The content of a qsf file, read from the fs
 * @param currentProjectPath Workspace path to current project
 * @param quartusBinPath Path to quartus binaries
 * @param name Name of the assignment to get
 * 
 * @returns An array of all assignments set
 */
export function getProjectGlobal(context: vscode.ExtensionContext, currentProjectPath: string, quartusBinPath: string, name: string) {
    const totalProjectPath = path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, currentProjectPath);
    const totalQuartusBinPath = path.join(quartusBinPath, 'quartus_sh');
    const totalScriptPath = path.join(context.extensionPath, 'res', 'getGlobal.tcl');

    const scriptCmdArgs = '"' + totalProjectPath + '" ' + name;

    const scriptCmd = '"' + totalQuartusBinPath + '" -t "' + totalScriptPath + '" ' + scriptCmdArgs;
    const commandOutput = cp.execSync(scriptCmd, { encoding: 'utf8' }).split('\n');

    let filteredCommandOutput: string[] = []

    for (let currentLine = 0; currentLine < commandOutput.length; currentLine++) {
        if (!commandOutput[currentLine].trim().startsWith('Info') && commandOutput[currentLine].trim() != '') {
            filteredCommandOutput.push(commandOutput[currentLine].trim())
        }
    }

    return filteredCommandOutput;
}

/**
 * @brief Sets a global assignment for the currently active project
 * 
 * @param context The content of a qsf file, read from the fs
 * @param currentProjectPath Workspace path to current project
 * @param quartusBinPath Path to quartus binaries
 * @param name Name of the assignment to set
 * @param value Value to assign to the assignment
 */
export function setProjectGlobal(context: vscode.ExtensionContext, currentProjectPath: string, quartusBinPath: string, name: string, value: string) {
    const totalProjectPath = path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, currentProjectPath);
    const totalQuartusBinPath = path.join(quartusBinPath, 'quartus_sh');
    const totalScriptPath = path.join(context.extensionPath, 'res', 'setGlobal.tcl');

    const scriptCmdArgs = '"' + totalProjectPath + '" ' + name + ' "' + value + '"';

    const scriptCmd = '"' + totalQuartusBinPath + '" -t "' + totalScriptPath + '" ' + scriptCmdArgs;
    cp.execSync(scriptCmd, { encoding: 'utf8' }).split('\n');
}

/**
 * @brief Get the top level file of a project
 * 
 * @param context The content of a qsf file, read from the fs
 * @param currentProjectPath Workspace path to current project
 * @param quartusBinPath Path to quartus binaries
 * 
 * @returns String of top level project file
 */
export function getProjectTopLevel(context: vscode.ExtensionContext, currentProjectPath: string, quartusBinPath: string)
{
    return getProjectGlobal(context, currentProjectPath, quartusBinPath, 'TOP_LEVEL_ENTITY')[0];
}

/**
 * @brief Sets the top level file of a project
 * 
 * @param context The content of a qsf file, read from the fs
 * @param currentProjectPath Workspace path to current project
 * @param quartusBinPath Path to quartus binaries
 * @param newTopLevel The new top level entity
 */
export function setProjectTopLevel(context: vscode.ExtensionContext, currentProjectPath: string, quartusBinPath: string, newTopLevel: string)
{
    setProjectGlobal(context, currentProjectPath, quartusBinPath, 'TOP_LEVEL_ENTITY', newTopLevel);
}