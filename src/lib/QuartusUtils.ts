import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as cp from 'child_process';
import * as pathUtils from './PathUtils';
import { outputChannel } from '../extension';

const SUPPORTED_QUARTUS_VERSIONS: string[] = ['23.1std'];

const TCL_RETURN_FORMAT_REGEX: RegExp = /(?:\{(.*?)\}|(\S+))/g;

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

export interface quartusSourceFile {
    path: string;
    children?: quartusSourceFile[];
}

export interface quartusProperty {
    name: string;
    value: string;
    children?: quartusProperty[];
}

/**
 * @brief Gets all quartus project files (file extension .qpf) in the current workspace
 * 
 * @returns An array of all quartus project files
 */
export function getAllProjectFiles(): string[] {
    const allFiles: string[] = pathUtils.resolvePathWithWildcards(path.normalize('**/*.*'));
    const allProjectFiles: string[] = [];

    // Check all files for project file extension
    for (let fileIndex = 0; fileIndex < allFiles.length; fileIndex++) {
        if (path.extname(allFiles[fileIndex]) === '.qsf') {
            allProjectFiles.push(allFiles[fileIndex].replace(vscode.workspace.workspaceFolders![0].uri.fsPath, '').replaceAll('\\', '/'));
        }
    }

    return allProjectFiles;
}

export function checkQuartusVersion(pathToQuartus: string): string {
    const pathToQuartusShell = path.join(pathToQuartus, 'quartus_sh');
    const quartusVersionOutput: string = cp.execSync('"' + pathToQuartusShell + '" -v').toString();

    for (let versionIndex = 0; versionIndex < SUPPORTED_QUARTUS_VERSIONS.length; versionIndex++) {
        if (quartusVersionOutput.includes(SUPPORTED_QUARTUS_VERSIONS[versionIndex])) {
            return SUPPORTED_QUARTUS_VERSIONS[versionIndex];
        }
    }

    vscode.window.showWarningMessage('The version of you quartus installation isn\'t officially supported! Check https://github.com/BakxY/VHDL-QQS/blob/main/QUARTUS_VERSIONS.md for supported versions!');
    console.warn('The version of you quartus installation isn\'t officially supported! Check https://github.com/BakxY/VHDL-QQS/blob/main/QUARTUS_VERSIONS.md for supported versions!');
    outputChannel.appendLine('The version of you quartus installation isn\'t officially supported! Check https://github.com/BakxY/VHDL-QQS/blob/main/QUARTUS_VERSIONS.md for supported versions!');

    return '';
}

/**
 * @brief Checks a path for files common for a quartus installation
 * 
 * @param pathToQuartus The installation path to check
 * 
 * @returns A boolean type, true if common files are present, else false
 */
export function checkForQuartusInstallation(pathToQuartus: string): boolean {
    // Check if bin path exists
    if (!fs.existsSync(pathToQuartus)) { return false; }

    // Read all files in folder
    const allQuartusFiles: string[] = fs.readdirSync(pathToQuartus);

    // Check what platform is running
    if (process.platform === 'win32') {
        // Check of required quartus files
        if (!allQuartusFiles.includes('quartus_sh.exe')) {
            return false;
        }

        if (!allQuartusFiles.includes('quartus_pgmw.exe')) {
            return false;
        }

        if (!allQuartusFiles.includes('qnui.exe')) {
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

        if (!allQuartusFiles.includes('qnui')) {
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
export function getProjectGlobal(context: vscode.ExtensionContext, currentProjectPath: string, quartusBinPath: string, name: string): string[] {
    const totalProjectPath = path.join(pathUtils.getWorkspacePath()!, currentProjectPath);
    const totalQuartusBinPath = path.join(quartusBinPath, 'quartus_sh');
    const totalScriptPath = path.join(context.extensionPath, 'res', 'getGlobal.tcl');

    // Generate all command argument
    const scriptCmdArgs = '"' + totalProjectPath + '" ' + name;

    // Generate script command string and run command
    const scriptCmd = '"' + totalQuartusBinPath + '" -t "' + totalScriptPath + '" ' + scriptCmdArgs;
    let commandOutput: string[] = [];

    try {
        commandOutput = cp.execSync(scriptCmd, { encoding: 'utf8' }).split('\n');
    }
    catch {
        console.error('Error while executing "' + scriptCmd + '"!\nstdout dump:\n' + commandOutput);
        vscode.window.showErrorMessage('Error while executing "' + scriptCmd + '"!\nstdout dump:\n' + commandOutput);
        outputChannel.appendLine('Error while executing "' + scriptCmd + '"!\nstdout dump:\n' + commandOutput);
    }

    const filteredCommandOutput: string[] = [];

    // Filter output to not include info statements
    for (let currentLine = 0; currentLine < commandOutput.length; currentLine++) {
        if (!commandOutput[currentLine].trim().startsWith('Info') && commandOutput[currentLine].trim() !== '') {
            filteredCommandOutput.push(commandOutput[currentLine].trim());
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
export function setProjectGlobal(context: vscode.ExtensionContext, currentProjectPath: string, quartusBinPath: string, name: string, value: string): void {
    const totalProjectPath = path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, currentProjectPath);
    const totalQuartusBinPath = path.join(quartusBinPath, 'quartus_sh');
    const totalScriptPath = path.join(context.extensionPath, 'res', 'setGlobal.tcl');

    // Generate all command argument
    const scriptCmdArgs = '"' + totalProjectPath + '" ' + name + ' "' + value + '"';

    // Generate script command string and run command
    const scriptCmd = '"' + totalQuartusBinPath + '" -t "' + totalScriptPath + '" ' + scriptCmdArgs;

    try {
        cp.execSync(scriptCmd, { encoding: 'utf8' });
    }
    catch (err) {
        console.error('Error while executing "' + scriptCmd + '"!\nerror dump:\n' + err);
        vscode.window.showErrorMessage('Error while executing "' + scriptCmd + '"!\nerror dump:\n' + err);
        outputChannel.appendLine('Error while executing "' + scriptCmd + '"!\nerror dump:\n' + err);
    }
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
export function getProjectTopLevel(context: vscode.ExtensionContext, currentProjectPath: string, quartusBinPath: string): string {
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
export function setProjectTopLevel(context: vscode.ExtensionContext, currentProjectPath: string, quartusBinPath: string, newTopLevel: string): void {
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
export function getProjectVhdlSourceFiles(context: vscode.ExtensionContext, currentProjectPath: string, quartusBinPath: string): string[] {
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
export function getProjectVerilogSourceFiles(context: vscode.ExtensionContext, currentProjectPath: string, quartusBinPath: string): string[] {
    return getProjectGlobal(context, currentProjectPath, quartusBinPath, 'VERILOG_FILE');
}

/**
 * @brief Gets the path to the compile output
 * 
 * @param context The context form where the function was ran
 * @param currentProjectPath Workspace path to current project
 * @param quartusBinPath Path to quartus binaries
 * 
 * @returns A path to the compile path
 */
export function getProjectOutputDir(context: vscode.ExtensionContext, currentProjectPath: string, quartusBinPath: string): string {
    return getProjectGlobal(context, currentProjectPath, quartusBinPath, 'PROJECT_OUTPUT_DIRECTORY')[0];
}

/**
 * @brief Checks if a provided path is part of the quartus project
 * 
 * @param context The context form where the function was ran
 * @param filePath The path to the source file to check
 * 
 * @returns A boolean if the file is part of project
 */
export function checkFileInProject(context: vscode.ExtensionContext, filePath: string): boolean | null {
    // Check if file is a VHDL or Verilog file
    if (!['.vhd', '.v'].includes(path.extname(filePath))) { return null; }

    // Get currently active project
    const activeProject: string | null = pathUtils.getCurrentQuartusProject(context);
    if (activeProject === null) { return false; }

    // Get  quartus install bin path
    const quartusPath: string | null = pathUtils.getQuartusBinPath();
    if (quartusPath === null) { return false; }

    // Resolve the path of source file
    const projectFilePath = path.dirname(path.join(pathUtils.getWorkspacePath()!, activeProject));
    const vhdlSourceFiles: string[] = pathUtils.resolveRelativePathArray(projectFilePath, getProjectVhdlSourceFiles(context, activeProject, quartusPath));
    const verilogSourceFiles: string[] = pathUtils.resolveRelativePathArray(projectFilePath, getProjectVerilogSourceFiles(context, activeProject, quartusPath));

    return vhdlSourceFiles.includes(filePath) || verilogSourceFiles.includes(filePath);
}

/**
 * @brief Adds a VHDL source file to project
 * 
 * @param context The context form where the function was ran
 * @param currentProjectPath Workspace path to current project
 * @param quartusBinPath Path to quartus binaries
 * @param newTopLevel The path to the new vhdl source file
 */
export function addVhdlFileToProject(context: vscode.ExtensionContext, currentProjectPath: string, quartusBinPath: string, newSourceFile: string): void {
    setProjectGlobal(context, currentProjectPath, quartusBinPath, 'VHDL_FILE', newSourceFile);
}

/**
 * @brief Adds a Verilog source file to project
 * 
 * @param context The context form where the function was ran
 * @param currentProjectPath Workspace path to current project
 * @param quartusBinPath Path to quartus binaries
 * @param newTopLevel The path to the new Verilog source file
 */
export function addVerilogFileToProject(context: vscode.ExtensionContext, currentProjectPath: string, quartusBinPath: string, newSourceFile: string): void {
    setProjectGlobal(context, currentProjectPath, quartusBinPath, 'VERILOG_FILE', newSourceFile);
}

/**
 * @brief Removed a global assignment entry from the project file
 * 
 * @param context The context form where the function was ran
 * @param currentProjectPath Workspace path to current project
 * @param quartusBinPath Path to quartus binaries
 * @param name The name of the assignment to remove
 * @param value The value of the assignment to remove, needed for identification
 */
export function removeProjectGlobal(context: vscode.ExtensionContext, currentProjectPath: string, quartusBinPath: string, name: string, value: string): void {
    const totalProjectPath = path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, currentProjectPath);
    const totalQuartusBinPath = path.join(quartusBinPath, 'quartus_sh');
    const totalScriptPath = path.join(context.extensionPath, 'res', 'removeGlobal.tcl');

    // Generate all command argument
    const scriptCmdArgs = '"' + totalProjectPath + '" ' + name + ' "' + value + '" -remove';

    // Generate script command string and run command
    const scriptCmd = '"' + totalQuartusBinPath + '" -t "' + totalScriptPath + '" ' + scriptCmdArgs;
    let commandOutput: string = '';

    try {
        commandOutput = cp.execSync(scriptCmd, { encoding: 'utf8' });
    }
    catch {
        console.error('Error while executing "' + scriptCmd + '"!\nstdout dump:\n' + commandOutput);
        vscode.window.showErrorMessage('Error while executing "' + scriptCmd + '"!\nstdout dump:\n' + commandOutput);
        outputChannel.appendLine('Error while executing "' + scriptCmd + '"!\nstdout dump:\n' + commandOutput);
    }
}

/**
 * @brief Remove a VHDL source file from project
 * 
 * @param context The context form where the function was ran
 * @param currentProjectPath Workspace path to current project
 * @param quartusBinPath Path to quartus binaries
 * @param toRemoveFile The path to the file to remove
 */
export function removeVhdlFileToProject(context: vscode.ExtensionContext, currentProjectPath: string, quartusBinPath: string, toRemoveFile: string): void {
    removeProjectGlobal(context, currentProjectPath, quartusBinPath, 'VHDL_FILE', toRemoveFile);
}

/**
 * @brief Remove a Verilog source file from project
 * 
 * @param context The context form where the function was ran
 * @param currentProjectPath Workspace path to current project
 * @param quartusBinPath Path to quartus binaries
 * @param toRemoveFile The path to the file to remove
 */
export function removeVerilogFileToProject(context: vscode.ExtensionContext, currentProjectPath: string, quartusBinPath: string, toRemoveFile: string): void {
    removeProjectGlobal(context, currentProjectPath, quartusBinPath, 'VERILOG_FILE', toRemoveFile);
}

/**
 * @brief Convert a string array to the data type used by tree view
 * 
 * @param dataToConvert The string array to convert
 * 
 * @returns The converted data in custom data type format
 */
export function convertToQuartusSourceFileType(dataToConvert: string[]): quartusSourceFile[] {
    const convertedData: quartusSourceFile[] = [];

    for (let fileIndex = 0; fileIndex < dataToConvert.length; fileIndex++) {
        convertedData.push({ path: dataToConvert[fileIndex] });
    }

    return convertedData;
}

/**
 * @brief Reads one project property from the project file
 * 
 * @param context The context form where the function was ran
 * @param currentProjectPath Workspace path to current project
 * @param quartusBinPath Path to quartus binaries
 * @param property The property identifier to read from
 * @param readableFormat A human readable format of the property to read, used for displaying
 * 
 * @returns Custom view data type populated with property data
 */
export function readProjectProperty(context: vscode.ExtensionContext, currentProjectPath: string, quartusBinPath: string, property: string, readableFormat: string): quartusProperty {
    const readValue = getProjectGlobal(context, currentProjectPath, quartusBinPath, property);

    if (readValue.length === 1) {
        return { name: readableFormat, value: readValue[0] };
    }
    else {
        const properties: quartusProperty = { name: readableFormat, value: '', children: [] };

        for (let propertyIndex = 0; propertyIndex < readValue.length; propertyIndex++) {
            properties.children?.push({ name: String(propertyIndex + 1), value: readValue[propertyIndex] });
        }

        return properties;
    }

}

/**
 * @brief Custom class implementation for quartus project files display
 */
export class QuartusProjectFileTreeDataProvider implements vscode.TreeDataProvider<quartusSourceFile> {
    // Internal data storage
    private data: quartusSourceFile[] = [];

    private _onDidChangeTreeData: vscode.EventEmitter<quartusSourceFile | undefined | null> = new vscode.EventEmitter<quartusSourceFile | undefined | null>();
    readonly onDidChangeTreeData: vscode.Event<quartusSourceFile | undefined | null> = this._onDidChangeTreeData.event;

    getTreeItem(element: quartusSourceFile): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(element.path, element.children ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
        treeItem.tooltip = element.path;
        return treeItem;
    }

    getChildren(element?: quartusSourceFile): Thenable<quartusSourceFile[]> {
        if (element) {
            return Promise.resolve(element.children || []);
        } else {
            return Promise.resolve(this.data);
        }
    }

    updateData(context: vscode.ExtensionContext, currentProjectPath: string, quartusBinPath: string): void {
        let allFiles: string[] = [];

        allFiles = allFiles.concat(getProjectVhdlSourceFiles(context, currentProjectPath, quartusBinPath));
        allFiles = allFiles.concat(getProjectVerilogSourceFiles(context, currentProjectPath, quartusBinPath));

        this.data = convertToQuartusSourceFileType(allFiles);
        this._onDidChangeTreeData.fire(null);
    }
}

/**
 * @brief Custom class implementation for quartus project property display
 */
export class QuartusProjectPropertiesTreeDataProvider implements vscode.TreeDataProvider<quartusProperty> {
    // Internal data storage
    private data: quartusProperty[] = [];

    private _onDidChangeTreeData: vscode.EventEmitter<quartusProperty | undefined | null> = new vscode.EventEmitter<quartusProperty | undefined | null>();
    readonly onDidChangeTreeData: vscode.Event<quartusProperty | undefined | null> = this._onDidChangeTreeData.event;

    getTreeItem(element: quartusProperty): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(element.name + ': ' + element.value, element.children ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);

        // Add the command and decoration for the "Copy" button
        treeItem.command = {
            command: 'vhdl-qqs.changeQuartusProjectProperty',
            title: 'Change',
            arguments: [element] // Pass the property object to the command
        };

        return treeItem;
    }

    getChildren(element?: quartusProperty): Thenable<quartusProperty[]> {
        if (element) {
            return Promise.resolve(element.children || []);
        } else {
            return Promise.resolve(this.data);
        }
    }

    updateData(context: vscode.ExtensionContext, currentProjectPath: string, quartusBinPath: string): void {
        const allProperties: quartusProperty[] = [];

        allProperties.push(readProjectProperty(context, currentProjectPath, quartusBinPath, 'FAMILY', 'Family'));
        allProperties.push(readProjectProperty(context, currentProjectPath, quartusBinPath, 'DEVICE', 'Device'));
        allProperties.push(readProjectProperty(context, currentProjectPath, quartusBinPath, 'VHDL_INPUT_VERSION', 'VHDL Version'));
        allProperties.push(readProjectProperty(context, currentProjectPath, quartusBinPath, 'VERILOG_INPUT_VERSION', 'Verilog Version'));

        this.data = allProperties;
        this._onDidChangeTreeData.fire(null);
    }
}

/**
 * @brief Returns the available vhdl versions for the user to select from.
 * @link https://www.intel.com/content/www/us/en/docs/programmable/683084/current/vhdl-input-version.html
 */
export function getAvailableVhdlVersions(): string[] {
    return ['VHDL_2008', 'VHDL_1993', 'VHDL_1987'];
}

/**
 * @brief Returns the available verilog versions for the user to select from.
 * @link https://www.intel.com/content/www/us/en/docs/programmable/683084/current/verilog-input-version.html
 */
export function getAvailableVerilogVersions(): string[] {
    return ['SystemVerilog_2005', 'Verilog_1995', 'Verilog_2001'];
}

/**
 * @brief Evaluates a tcl command in the quartus shell
 */
export function evalTclCmd(context: vscode.ExtensionContext, quartusBinPath: string, tclCmd: string): string | null {
    const totalQuartusBinPath = path.join(quartusBinPath, 'quartus_sh');

    // Generate script command string and run command
    const scriptCmd = '"' + totalQuartusBinPath + '" --tcl_eval ' + tclCmd;
    let commandOutput: string = '';

    try {
        commandOutput = cp.execSync(scriptCmd, { encoding: 'utf8' });
    }
    catch (err) {
        console.error('Error while executing "' + scriptCmd + '"!\nerror dump:\n' + err);
        vscode.window.showErrorMessage('Error while executing "' + scriptCmd + '"!\nerror dump:\n' + err);
        outputChannel.appendLine('Error while executing "' + scriptCmd + '"!\nerror dump:\n' + err);

        return null;
    }

    return commandOutput.toString();
}

/**
 * @brief Gets all of the available families of chips
 */
export function getAvailableChipFamilies(context: vscode.ExtensionContext, quartusBinPath: string): string[] | null {
    const cmdReturn: string | null = evalTclCmd(context, quartusBinPath, 'get_family_list');
    if (cmdReturn === null) { return null; }

    const families: string[] | null = cmdReturn.match(TCL_RETURN_FORMAT_REGEX);

    if (families === null) {
        console.error('Tcl evaluated return value didn\'t match expected format!');
        vscode.window.showErrorMessage('Tcl evaluated return value didn\'t match expected format!');
        outputChannel.appendLine('Tcl evaluated return value didn\'t match expected format!');

        return null;
    }

    const filteredFamilies: string[] = [];

    for (let familyIndex = 0; familyIndex < families.length; familyIndex++) {
        if (families[familyIndex].startsWith('{') && families[familyIndex].endsWith('}')) {
            filteredFamilies.push(families[familyIndex].substring(1, families[familyIndex].length - 1));
        }
        else {
            filteredFamilies.push(families[familyIndex]);
        }
    }

    return filteredFamilies;
}

/**
 * @brief Gets all of the available chips in a family
 */
export function getAvailableChips(context: vscode.ExtensionContext, quartusBinPath: string, family: string): string[] | null {
    const cmdReturn: string | null = evalTclCmd(context, quartusBinPath, 'get_part_list -family "' + family + '"');
    if (cmdReturn === null) { return null; }

    const families: string[] | null = cmdReturn.match(TCL_RETURN_FORMAT_REGEX);

    if (families === null) {
        console.error('Tcl evaluated return value didn\'t match expected format!');
        vscode.window.showErrorMessage('Tcl evaluated return value didn\'t match expected format!');
        outputChannel.appendLine('Tcl evaluated return value didn\'t match expected format!');
    }

    return families;
}