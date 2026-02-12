import * as path from 'path';
import * as vscode from 'vscode';
import * as pathUtils from './PathUtils';
import * as quartus from './QuartusUtils';

/**
 * @brief Function initializes the status bar item/button for the active quartus project
 * 
 * @param context The context form where the function was ran
 * 
 * @returns The initialized status bar item
 */
export function createActiveQuartusProject(context: vscode.ExtensionContext): vscode.StatusBarItem {
    const currentProjectDisplay: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);
    currentProjectDisplay.command = 'vhdl-qqs.selectQuartusProject';

    let activeProjectName: string | undefined = context.workspaceState.get('vhdl-qqs.currentActiveQuartusProject', undefined);

    // Check if a project is selected in current workspace
    if (activeProjectName === undefined) {
        activeProjectName = 'None';
    }
    else {
        activeProjectName = path.basename(activeProjectName).replace(path.extname(activeProjectName), '');
    }

    currentProjectDisplay.text = 'Quartus: ' + activeProjectName;
    currentProjectDisplay.tooltip = 'Change current active quartus project';

    currentProjectDisplay.show();

    return currentProjectDisplay;
}

/**
 * @brief Function initializes the status bar item/button for the active questa project
 * 
 * @param context The context form where the function was ran
 * 
 * @returns The initialized status bar item
 */
export function createActiveQuestaProject(context: vscode.ExtensionContext): vscode.StatusBarItem {
    const currentProjectDisplay: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);
    currentProjectDisplay.command = 'vhdl-qqs.selectQuestaProject';

    let activeProjectName: string | undefined = context.workspaceState.get('vhdl-qqs.currentActiveQuestaProject', undefined);

    // Check if a project is selected in current workspace
    if (activeProjectName === undefined) {
        activeProjectName = 'None';
    }
    else {
        activeProjectName = path.basename(activeProjectName).replace(path.extname(activeProjectName), '');
    }

    currentProjectDisplay.text = 'Questa: ' + activeProjectName;
    currentProjectDisplay.tooltip = 'Change current active questa project';

    if(vscode.workspace.getConfiguration('vhdl-qqs').get('questaFeatureFlag'))
    {
        currentProjectDisplay.show();
    }
    
    return currentProjectDisplay;
}

/**
 * @brief Function initializes the status bar item/button for the active questa test script
 * 
 * @param context The context form where the function was ran
 * 
 * @returns The initialized status bar item
 */
export function createActiveQuestaTestScript(context: vscode.ExtensionContext): vscode.StatusBarItem {
    const currentTestScriptDisplay: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);
    currentTestScriptDisplay.command = 'vhdl-qqs.selectQuestaTestScript';

    let activeTestScriptName: string | undefined = context.workspaceState.get('vhdl-qqs.currentActiveQuestaTestScript', undefined);

    // Check if a test script is selected in current workspace
    if (activeTestScriptName === undefined) {
        activeTestScriptName = 'None';
    }
    else {
        activeTestScriptName = path.basename(activeTestScriptName);
    }

    currentTestScriptDisplay.text = 'Test Script: ' + activeTestScriptName;
    currentTestScriptDisplay.tooltip = 'Change current active questa test script';

    if(vscode.workspace.getConfiguration('vhdl-qqs').get('questaFeatureFlag'))
    {
        currentTestScriptDisplay.show();
    }
    
    return currentTestScriptDisplay;
}

/**
 * @brief Function initializes the status bar item/button for compiling active project
 * 
 * @returns The initialized status bar item
 */
export function createRunTests(): vscode.StatusBarItem {
    const runTestsButton: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);

    runTestsButton.command = 'vhdl-qqs.runQuestaTest';
    runTestsButton.text = '$(beaker)';
    runTestsButton.tooltip = 'Run questa tests for active questa project';

    if(vscode.workspace.getConfiguration('vhdl-qqs').get('questaFeatureFlag'))
    {
        runTestsButton.show();
    }

    return runTestsButton;
}

/**
 * @brief Function initializes the status bar item/button for the top level of active project
 * 
 * @param context The context form where the function was ran
 * 
 * @returns The initialized status bar item
 */
export async function createChangeTopLevel(context: vscode.ExtensionContext): Promise<vscode.StatusBarItem> {
    const currentTopLevelDisplay: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);

    currentTopLevelDisplay.command = 'vhdl-qqs.changeTopLevel';
    currentTopLevelDisplay.text = 'Top Level: None';
    currentTopLevelDisplay.tooltip = 'Change current top level entity of quartus project';

    currentTopLevelDisplay.show();

    const activeProject: string | null = await pathUtils.getCurrentQuartusProject(context);
    if (activeProject === null) { return currentTopLevelDisplay; }

    const quartusPath: string | null = await pathUtils.getQuartusBinPath();
    if (quartusPath === null) { return currentTopLevelDisplay; }

    // Get the top level file from project file
    const currentTopLevel: string = quartus.getProjectTopLevel(context, activeProject, quartusPath);

    // Check if project top level is defined
    if(currentTopLevel === undefined) { return currentTopLevelDisplay; }

    currentTopLevelDisplay.text = 'Top Level: ' + currentTopLevel;

    return currentTopLevelDisplay;
}

/**
 * @brief Function initializes the status bar item/button for compiling active project
 * 
 * @returns The initialized status bar item
 */
export function createCompileProject(): vscode.StatusBarItem {
    const compileProjectButton: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);

    compileProjectButton.command = 'vhdl-qqs.compileCurrentProject';
    compileProjectButton.text = '$(play)';
    compileProjectButton.tooltip = 'Compile the currently selected quartus project';

    compileProjectButton.show();

    return compileProjectButton;
}

/**
 * @brief Function initializes the status bar item/button for analysis and elaboration active project
 * 
 * @returns The initialized status bar item
 */
export function createAnalysisProject(): vscode.StatusBarItem {
    const analysisProjectButton: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);

    analysisProjectButton.command = 'vhdl-qqs.analyseElaborateCurrentProject';
    analysisProjectButton.text = '$(check)';
    analysisProjectButton.tooltip = 'Analyse and elaborate the currently selected quartus project';

    analysisProjectButton.show();

    return analysisProjectButton;
}

/**
 * @brief Function initializes the status bar item/button for cleaning output files for active project.
 * 
 * @returns The initialized status bar item
 */
export function createCleanProject(): vscode.StatusBarItem {
    const cleanCompileFilesButton: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);

    cleanCompileFilesButton.command = 'vhdl-qqs.cleanCompileFiles';
    cleanCompileFilesButton.text = '$(trash)';
    cleanCompileFilesButton.tooltip = 'Cleanup files from previous quartus compilation';

    cleanCompileFilesButton.show();

    return cleanCompileFilesButton;
}

/**
 * @brief Function initializes the status bar item/button for opening the fpga programmer for active project
 * 
 * @returns The initialized status bar item
 */
export function createOpenProgrammer(): vscode.StatusBarItem {
    const openProgrammerButton: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);

    openProgrammerButton.command = 'vhdl-qqs.openProgrammerActiveProject';
    openProgrammerButton.text = '$(flame)';
    openProgrammerButton.tooltip = 'Open quartus programmer on active compiled project';

    openProgrammerButton.show();

    return openProgrammerButton;
}

/**
 * @brief Function initializes the status bar item/button for opening the rtl viewer for active project
 * 
 * @returns The initialized status bar item
 */
export function createOpenRtlViewer(): vscode.StatusBarItem {
    const openProgrammerButton: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);

    openProgrammerButton.command = 'vhdl-qqs.openRtlViewerActiveProject';
    openProgrammerButton.text = '$(circuit-board)';
    openProgrammerButton.tooltip = 'Open quartus RTL Viewer on active project';

    openProgrammerButton.show();

    return openProgrammerButton;
}