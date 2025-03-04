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

    // Check all files for project file extension
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
    // Check if bin path exists
    if (!fs.existsSync(pathToQuartus)) { return false; }

    // Read all files in folder
    const allQuartusFiles: string[] = fs.readdirSync(pathToQuartus);

    // Check what platform is running
    if (process.platform == 'win32') {
        // Check of required quartus files
        if (!allQuartusFiles.includes('quartus_sh.exe')) {
            return false;
        }

        if (!allQuartusFiles.includes('quartus_pgmw.exe')) {
            return false;
        }
    }
    else {
        // Check of required quartus files
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
 * @param context The context form where the function was ran
 * @param currentProjectPath Workspace path to current project
 * @param quartusBinPath Path to quartus binaries
 * @param name Name of the assignment to get
 * 
 * @returns An array of all assignments set
 */
export function getProjectGlobal(context: vscode.ExtensionContext, currentProjectPath: string, quartusBinPath: string, name: string) {
    const totalProjectPath = path.join(pathUtils.getWorkspacePath()!, currentProjectPath);
    const totalQuartusBinPath = path.join(quartusBinPath, 'quartus_sh');
    const totalScriptPath = path.join(context.extensionPath, 'res', 'getGlobal.tcl');

    // Generate all command argument
    const scriptCmdArgs = '"' + totalProjectPath + '" ' + name;

    // Generate script command string and run command
    const scriptCmd = '"' + totalQuartusBinPath + '" -t "' + totalScriptPath + '" ' + scriptCmdArgs;
    const commandOutput = cp.execSync(scriptCmd, { encoding: 'utf8' }).split('\n');

    let filteredCommandOutput: string[] = []

    // Filter output to not include info statements
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
 * @param context The context form where the function was ran
 * @param currentProjectPath Workspace path to current project
 * @param quartusBinPath Path to quartus binaries
 * @param name Name of the assignment to set
 * @param value Value to assign to the assignment
 */
export function setProjectGlobal(context: vscode.ExtensionContext, currentProjectPath: string, quartusBinPath: string, name: string, value: string) {
    const totalProjectPath = path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, currentProjectPath);
    const totalQuartusBinPath = path.join(quartusBinPath, 'quartus_sh');
    const totalScriptPath = path.join(context.extensionPath, 'res', 'setGlobal.tcl');

    // Generate all command argument
    const scriptCmdArgs = '"' + totalProjectPath + '" ' + name + ' "' + value + '"';

    // Generate script command string and run command
    const scriptCmd = '"' + totalQuartusBinPath + '" -t "' + totalScriptPath + '" ' + scriptCmdArgs;
    cp.execSync(scriptCmd, { encoding: 'utf8' }).split('\n');
}

/**
 * @brief Get the top level file of a project
 * 
 * @param context The context form where the function was ran
 * @param currentProjectPath Workspace path to current project
 * @param quartusBinPath Path to quartus binaries
 * 
 * @returns String of top level project file
 */
export function getProjectTopLevel(context: vscode.ExtensionContext, currentProjectPath: string, quartusBinPath: string) {
    return getProjectGlobal(context, currentProjectPath, quartusBinPath, 'TOP_LEVEL_ENTITY')[0];
}

/**
 * @brief Sets the top level file of a project
 * 
 * @param context The context form where the function was ran
 * @param currentProjectPath Workspace path to current project
 * @param quartusBinPath Path to quartus binaries
 * @param newTopLevel The new top level entity
 */
export function setProjectTopLevel(context: vscode.ExtensionContext, currentProjectPath: string, quartusBinPath: string, newTopLevel: string) {
    setProjectGlobal(context, currentProjectPath, quartusBinPath, 'TOP_LEVEL_ENTITY', newTopLevel);
}

/**
 * @brief Gets all VHDL source files from project file
 * 
 * @param context The context form where the function was ran
 * @param currentProjectPath Workspace path to current project
 * @param quartusBinPath Path to quartus binaries
 * 
 * @returns A array of string of all of the VHDL files in the project file
 */
export function getProjectVhdlSourceFiles(context: vscode.ExtensionContext, currentProjectPath: string, quartusBinPath: string) {
    return getProjectGlobal(context, currentProjectPath, quartusBinPath, 'VHDL_FILE');
}

/**
 * @brief Gets all Verilog source files from project file
 * 
 * @param context The context form where the function was ran
 * @param currentProjectPath Workspace path to current project
 * @param quartusBinPath Path to quartus binaries
 * 
 * @returns A array of string of all of the Verilog files in the project file
 */
export function getProjectVerilogSourceFiles(context: vscode.ExtensionContext, currentProjectPath: string, quartusBinPath: string) {
    return getProjectGlobal(context, currentProjectPath, quartusBinPath, 'VERILOG_FILE');
}

// TODO: Comments
export function checkFileInProject(context: vscode.ExtensionContext,  filePath: string): boolean | null {
    // Check if file is a VHDL or Verilog file
    if (!['.vhd', '.v'].includes(path.extname(filePath))) { return null; }

    // Get currently active project
    const activeProject: string | null = pathUtils.getCurrentProject(context);
    if (activeProject == null) { return false; }

    // Get  quartus install bin path
    const quartusPath: string | null = pathUtils.getQuartusBinPath();
    if (quartusPath == null) { return false; }

    const projectFilePath = path.dirname(path.join(pathUtils.getWorkspacePath()!, activeProject));
    const vhdlSourceFiles: string[] = pathUtils.resolveRelativePathArray(projectFilePath, getProjectVhdlSourceFiles(context, activeProject, quartusPath));

    return vhdlSourceFiles.includes(filePath)
}