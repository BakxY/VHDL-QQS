import * as path from 'path';
import * as vscode from 'vscode'

export function createActiveProject(context: vscode.ExtensionContext) {
    let currentProjectDisplay = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 11);
    currentProjectDisplay.command = 'vhdl-qqs.selectCurrentProject';

    let activeProjectName: string | undefined = context.workspaceState.get('vhdl-qqs.currentActiveProject', undefined);

    if (activeProjectName == undefined) {
        activeProjectName = 'None'
    }
    else {
        activeProjectName = path.basename(activeProjectName).replace(path.extname(activeProjectName), '');
    }

    currentProjectDisplay.text = 'Project: ' + activeProjectName;
    currentProjectDisplay.tooltip = 'Change current active quartus project';

    currentProjectDisplay.show();

    return currentProjectDisplay;
}

export function createChangeTopLevel() {
    let currentTopLevelDisplay = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);

    currentTopLevelDisplay.command = 'vhdl-qqs.changeTopLevel';
    currentTopLevelDisplay.text = '$(file-code)';
    currentTopLevelDisplay.tooltip = 'Change current top level entity of quartus project';

    currentTopLevelDisplay.show();

    return currentTopLevelDisplay;
}

export function createCompileProject() {
    let compileProjectButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);

    compileProjectButton.command = 'vhdl-qqs.compileCurrentProject';
    compileProjectButton.text = '$(play)';
    compileProjectButton.tooltip = 'Compile the currently selected quartus project';

    compileProjectButton.show();

    return compileProjectButton;
}

export function createCleanProject() {
    let cleanCompileFilesButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);

    cleanCompileFilesButton.command = 'vhdl-qqs.cleanCompileFiles';
    cleanCompileFilesButton.text = '$(trash)';
    cleanCompileFilesButton.tooltip = 'Cleanup files from previous quartus compilation';

    cleanCompileFilesButton.show();

    return cleanCompileFilesButton;
}

export function createOpenProgrammer() {
    let openProgrammerButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);

    openProgrammerButton.command = 'vhdl-qqs.openProgrammerActiveProject';
    openProgrammerButton.text = '$(flame)';
    openProgrammerButton.tooltip = 'Open quartus programmer on active compiled project';

    openProgrammerButton.show();

    return openProgrammerButton;
}
