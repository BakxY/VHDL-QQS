import * as path from 'path';
import * as vscode from 'vscode'
import * as pathUtils from './PathUtils'
import * as quartus from './QuartusUtils'

// TODO: Comment all of this code

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

export async function createChangeTopLevel(context: vscode.ExtensionContext) {
    let currentTopLevelDisplay = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);

    currentTopLevelDisplay.command = 'vhdl-qqs.changeTopLevel';
    currentTopLevelDisplay.text = 'Top Level: None';
    currentTopLevelDisplay.tooltip = 'Change current top level entity of quartus project';

    currentTopLevelDisplay.show();

    const activeProject: string | null = await pathUtils.getCurrentProject(context);
    if (activeProject == null) { return currentTopLevelDisplay; }

    const quartusPath: string | null = await pathUtils.getQuartusBinPath();
    if (quartusPath == null) { return currentTopLevelDisplay; }

    const currentTopLevel: string = quartus.getProjectTopLevel(context, activeProject, quartusPath);

    if(currentTopLevel == undefined) { return currentTopLevelDisplay; }

    currentTopLevelDisplay.text = 'Top Level: ' + currentTopLevel;

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

export function createOpenRtlViewer() {
    let openProgrammerButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);

    openProgrammerButton.command = 'vhdl-qqs.openRtlViewerActiveProject';
    openProgrammerButton.text = '$(circuit-board)';
    openProgrammerButton.tooltip = 'Open quartus RTL Viewer on active project';

    openProgrammerButton.show();

    return openProgrammerButton;
}