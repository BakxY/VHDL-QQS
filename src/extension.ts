import * as vscode from 'vscode';

// Import custom libs
import * as quartus from './lib/QuartusUtils';
import * as statusBarCreator from './lib/StatusBarUtils';
import * as pathUtils from './lib/PathUtils';
import * as vhdlLang from './lib/VhdlLang';

// Import command creators
import * as manualActivateExtension from './commands/manualActivateExtension';
import * as generateTestBenchSelection from './commands/generateTestBenchSelection';
import * as generateTestBenchExplorer from './commands/generateTestBenchExplorer';
import * as selectQuartusProject from './commands/selectQuartusProject';
import * as compileCurrentProject from './commands/compileCurrentProject';
import * as analyseElaborateCurrentProject from './commands/analyseElaborateCurrentProject';
import * as cleanCompileFiles from './commands/cleanCompileFiles';
import * as openProgrammerActiveProject from './commands/openProgrammerActiveProject';
import * as openRtlViewerActiveProject from './commands/openRtlViewerActiveProject';
import * as changeTopLevel from './commands/changeTopLevel';
import * as addFileToProjectContext from './commands/addFileToProjectContext';
import * as addFileToProject from './commands/addFileToProject';
import * as removeFileFromProjectContext from './commands/removeFileFromProjectContext';
import * as removeFileFromProject from './commands/removeFileFromProject';
import * as removeFileFromProjectExplorer from './commands/removeFileFromProjectExplorer';
import * as refreshSourceFiles from './commands/refreshSourceFiles';
import * as createNewEntity from './commands/createNewEntity';
import * as selectQuestaProject from './commands/selectQuestaProject';
import * as selectQuestaTestScript from './commands/selectQuestaTestScript';
import * as runQuestaTest from './commands/runQuestaTest';
import * as changeQuartusProjectProperty from './commands/changeQuartusProjectProperty';
import * as genDebugDevInfo from './commands/genDebugDevInfo';

// Import code formatters
import * as vhdl from './formatter/vhdl'

// Exports to all lib files and external command files
export let outputChannel: vscode.OutputChannel;
export let quartusProjectFilesView: quartus.QuartusProjectFileTreeDataProvider;
export let quartusProjectPropertiesView: quartus.QuartusProjectPropertiesTreeDataProvider;
export let currentQuestaProjectDisplay: vscode.StatusBarItem;
export let runQuestaTestsButton: vscode.StatusBarItem;
export let currentQuartusProjectDisplay: vscode.StatusBarItem;
export let currentQuestaTestScriptDisplay: vscode.StatusBarItem;
export let currentTopLevelDisplay: vscode.StatusBarItem;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	// Create a new output channel for this extension
	outputChannel = vscode.window.createOutputChannel("VHDL-QQS");

	// Push all commands to extension subscriptions
	context.subscriptions.push(manualActivateExtension.getCommand());
	context.subscriptions.push(generateTestBenchSelection.getCommand(context));
	context.subscriptions.push(generateTestBenchExplorer.getCommand(context));
	context.subscriptions.push(selectQuartusProject.getCommand(context));
	context.subscriptions.push(compileCurrentProject.getCommand(context));
	context.subscriptions.push(analyseElaborateCurrentProject.getCommand(context));
	context.subscriptions.push(cleanCompileFiles.getCommand(context));
	context.subscriptions.push(openProgrammerActiveProject.getCommand(context));
	context.subscriptions.push(openRtlViewerActiveProject.getCommand(context));
	context.subscriptions.push(changeTopLevel.getCommand(context));
	context.subscriptions.push(addFileToProjectContext.getCommand(context));
	context.subscriptions.push(addFileToProject.getCommand(context));
	context.subscriptions.push(removeFileFromProjectContext.getCommand(context));
	context.subscriptions.push(removeFileFromProject.getCommand(context));
	context.subscriptions.push(removeFileFromProjectExplorer.getCommand(context));
	context.subscriptions.push(refreshSourceFiles.getCommand(context));
	context.subscriptions.push(createNewEntity.getCommand(context));
	context.subscriptions.push(selectQuestaProject.getCommand(context));
	context.subscriptions.push(selectQuestaTestScript.getCommand(context));
	context.subscriptions.push(runQuestaTest.getCommand(context));
	context.subscriptions.push(changeQuartusProjectProperty.getCommand(context));
	context.subscriptions.push(genDebugDevInfo.getCommand());

	// Create status bar item to display the active quartus project
	currentQuartusProjectDisplay = statusBarCreator.createActiveQuartusProject(context);
	context.subscriptions.push(currentQuartusProjectDisplay);

	// Create status bar item to display the current top level entity
	currentTopLevelDisplay = await statusBarCreator.createChangeTopLevel(context);
	context.subscriptions.push(currentTopLevelDisplay);

	// Create all remaining status bar items
	context.subscriptions.push(statusBarCreator.createCleanProject());
	context.subscriptions.push(statusBarCreator.createCompileProject());
	context.subscriptions.push(statusBarCreator.createAnalysisProject());
	context.subscriptions.push(statusBarCreator.createOpenProgrammer());
	context.subscriptions.push(statusBarCreator.createOpenRtlViewer());

	// Create status bar item to display the active questa project
	currentQuestaProjectDisplay = statusBarCreator.createActiveQuestaProject(context);
	currentQuestaTestScriptDisplay = statusBarCreator.createActiveQuestaTestScript(context);
	context.subscriptions.push(currentQuestaProjectDisplay);

	// Create status bar item to run questa tests
	runQuestaTestsButton = statusBarCreator.createRunTests();
	context.subscriptions.push(runQuestaTestsButton);

	// Attach function as event handler to config changes
	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(async event => {
		if (event.affectsConfiguration('vhdl-qqs.questaFeatureFlag')) {
			if (vscode.workspace.getConfiguration('vhdl-qqs').get('questaFeatureFlag')) {
				currentQuestaProjectDisplay.show();
				runQuestaTestsButton.show();
			}
			else {
				currentQuestaProjectDisplay.hide();
				runQuestaTestsButton.hide();
			}
		}
		if (event.affectsConfiguration('vhdl-qqs.quartusBinPath')) {
			const quartusPath: string | null = await pathUtils.getQuartusBinPath();

			if (quartusPath !== null) {
				quartus.checkQuartusVersion(quartusPath);
			}
		}
	}));

	// Create and add quartus project files view to custom activity bar item
	quartusProjectFilesView = new quartus.QuartusProjectFileTreeDataProvider();
	vscode.window.createTreeView('projectSourceFiles', { treeDataProvider: quartusProjectFilesView });

	// Create and add quartus properties vew to custom activity bar item
	quartusProjectPropertiesView = new quartus.QuartusProjectPropertiesTreeDataProvider();
	vscode.window.createTreeView('projectProperties', { treeDataProvider: quartusProjectPropertiesView });

	// Update custom views with current data
	const activeProject: string | null = await pathUtils.getCurrentQuartusProject(context);
	if (activeProject !== null) {
		// Get  quartus install bin path
		const quartusPath: string | null = await pathUtils.getQuartusBinPath();
		if (quartusPath !== null) {
			quartus.checkQuartusVersion(quartusPath);

			quartusProjectFilesView.updateData(context, activeProject, quartusPath);
			quartusProjectPropertiesView.updateData(context, activeProject, quartusPath);
		}
	}

	// Handle checking for new versions of VHDL_lang and downloading the to fs
	vhdlLang.checkDownloadVhdlLang(context);

	// Create new document formatter for vhdl files
	context.subscriptions.push(vhdl.getFormatter(context));
}

export function deactivate(): void {

}