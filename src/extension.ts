import * as vscode from 'vscode';
import * as path from 'path';
import * as cp from 'child_process';

// Import custom libs
import * as quartus from './lib/QuartusUtils';
import * as statusBarCreator from './lib/StatusBarUtils';
import * as pathUtils from './lib/PathUtils';
import * as vhdlLang from './lib/VhdlLang';

// Import command creators
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
import * as removeFileFromProjectContext from './commands/removeFileFromProjectContext';
import * as removeFileFromProject from './commands/removeFileFromProject';
import * as refreshSourceFiles from './commands/refreshSourceFiles';
import * as createNewEntity from './commands/createNewEntity';
import * as selectQuestaProject from './commands/selectQuestaProject';
import * as runQuestaTest from './commands/runQuestaTest';
import * as changeQuartusProjectProperty from './commands/changeQuartusProjectProperty';
import * as genDebugDevInfo from './commands/genDebugDevInfo';

export let outputChannel: vscode.OutputChannel;
export let quartusProjectFilesView: quartus.QuartusProjectFileTreeDataProvider;
export let quartusProjectPropertiesView: quartus.QuartusProjectPropertiesTreeDataProvider;
export let currentQuestaProjectDisplay: vscode.StatusBarItem;
export let runQuestaTestsButton: vscode.StatusBarItem;
export let currentQuartusProjectDisplay: vscode.StatusBarItem;
export let currentTopLevelDisplay: vscode.StatusBarItem;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	outputChannel = vscode.window.createOutputChannel("VHDL-QQS");

	/**
	 * @brief Command that reloads entire VS Code windows so the extension restarts.
	 * @author BakxY
	 */
	var disposable = vscode.commands.registerCommand('vhdl-qqs.manualActivateExtension', () => {
		vscode.commands.executeCommand('workbench.action.reloadWindow');
	});
	context.subscriptions.push(disposable);

	/**
	 * @brief Command generates a new testbench for a entity. This commands uses the user selected expression as the entity to generate the testbench for.
	 * @author BakxY
	 */
	context.subscriptions.push(generateTestBenchSelection.getCommand(context));

	/**
	 * @brief Command generates a new testbench for a entity. This commands uses the toml file to get available entities and present the user with a menu selection.
	 * @author BakxY
	 */
	context.subscriptions.push(generateTestBenchExplorer.getCommand(context));

	/**
	 * @brief Command sets the currently selected project for the current workspace.
	 * @author BakxY
	 */
	context.subscriptions.push(selectQuartusProject.getCommand(context));

	/**
	 * @brief Commands created and runs a tcl script in the quartus tcl shell that will compile the currently active project.
	 * @author BakxY
	 */
	context.subscriptions.push(compileCurrentProject.getCommand(context));

	/**
	 * @brief Commands created and runs a tcl script in the quartus tcl shell that will analyse and elaborate the currently active project.
	 * @author BakxY
	 */
	context.subscriptions.push(analyseElaborateCurrentProject.getCommand(context));

	/**
	 * @brief Command cleans files that were generated by the compilation of a quartus project.
	 * @author BakxY
	 */
	context.subscriptions.push(cleanCompileFiles.getCommand(context));

	/**
	 * @brief Command opens the quartus fpga programmer for the currently active and compiled project
	 * @author BakxY
	 */
	context.subscriptions.push(openProgrammerActiveProject.getCommand(context));

	/**
	 * @brief Command opens the quartus rtl viewer for currently active project
	 * @author BakxY
	 */
	context.subscriptions.push(openRtlViewerActiveProject.getCommand(context));

	/**
	 * @brief Command changes the current top level entity file of the active project.
	 * @author BakxY
	 */
	context.subscriptions.push(changeTopLevel.getCommand(context));

	/**
	 * @brief Command used in context menu to add a file to the current project.
	 * @author BakxY
	 */
	context.subscriptions.push(addFileToProjectContext.getCommand(context));

	/**
	 * @brief Command used in context menu to remove a file from the current project.
	 * @author BakxY
	 */
	context.subscriptions.push(removeFileFromProjectContext.getCommand(context));

	/**
	 * @brief Command used to remove a file from the current project by a user menu selection.
	 * @author BakxY
	 */
	context.subscriptions.push(removeFileFromProject.getCommand(context));

	/**
	 * @brief Command used to refresh the data displayed in Quartus Source File list.
	 * @author BakxY
	 */
	context.subscriptions.push(refreshSourceFiles.getCommand(context));

	/**
	 * @brief Command used to create a new entity from a template file
	 * @author BakxY
	 */
	context.subscriptions.push(createNewEntity.getCommand(context));

	/**
	 * @brief Command used to select questa project to run tests for
	 * @author BakxY
	 */
	context.subscriptions.push(selectQuestaProject.getCommand(context));

	/**
	 * @brief Command used to run tests for selected questa project
	 * @author BakxY
	 */
	context.subscriptions.push(runQuestaTest.getCommand(context));

	/**
	 * @brief Command is called once user clicks on a project property
	 * @author BakxY
	 */
	context.subscriptions.push(changeQuartusProjectProperty.getCommand(context));

	/**
	 * @brief Command that connects and prints device and software information required in bug reports
	 * @author BakxY
	 */
	context.subscriptions.push(genDebugDevInfo.getCommand(context));


	currentQuartusProjectDisplay = statusBarCreator.createActiveQuartusProject(context);
	context.subscriptions.push(currentQuartusProjectDisplay);

	currentTopLevelDisplay = await statusBarCreator.createChangeTopLevel(context);
	context.subscriptions.push(currentTopLevelDisplay);

	context.subscriptions.push(statusBarCreator.createCleanProject());
	context.subscriptions.push(statusBarCreator.createCompileProject());
	context.subscriptions.push(statusBarCreator.createAnalysisProject());
	context.subscriptions.push(statusBarCreator.createOpenProgrammer());
	context.subscriptions.push(statusBarCreator.createOpenRtlViewer());

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

	currentQuestaProjectDisplay = statusBarCreator.createActiveQuestaProject(context);
	context.subscriptions.push(currentQuestaProjectDisplay);

	runQuestaTestsButton = statusBarCreator.createRunTests();
	context.subscriptions.push(runQuestaTestsButton);

	quartusProjectFilesView = new quartus.QuartusProjectFileTreeDataProvider();
	vscode.window.createTreeView('projectSourceFiles', { treeDataProvider: quartusProjectFilesView });

	quartusProjectPropertiesView = new quartus.QuartusProjectPropertiesTreeDataProvider();
	vscode.window.createTreeView('projectProperties', { treeDataProvider: quartusProjectPropertiesView });

	// Get currently active project
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

	vhdlLang.checkDownloadVhdlLang(context);

	context.subscriptions.push(
		vscode.languages.registerDocumentFormattingEditProvider('vhdl', {
			provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
				const edits: vscode.TextEdit[] = [];

				const pathToBin = path.join(context.extensionPath, 'res', 'vhdl_lang');

				if (!vhdlLang.checkForVhdlLang(context)) {
					vscode.window.showErrorMessage('No VHDL_lang executable found! Trying to download VHDL_lang!');
					console.error('No VHDL_lang executable found! Trying to download VHDL_lang!');
					outputChannel.appendLine('No VHDL_lang executable found! Trying to download VHDL_lang!');
					vhdlLang.checkDownloadVhdlLang(context);
					return edits;
				}

				// Save document before formatting it
				document.save();

				const fullRange: vscode.Range = new vscode.Range(0, 0, document.lineCount, 0);
				const execString: string = '"' + pathToBin + '" --format "' + document.uri.fsPath + '"';
				let formattedFile: Buffer<ArrayBufferLike> = Buffer.from([]);

				try {
					formattedFile = cp.execSync(execString);
				}
				catch (err) {
					if (err instanceof Error) {
						const processError = err as (Error & { stderr?: Buffer; stdout?: Buffer });

						console.error('Error while executing "' + execString + '"!\nerror dump:\n' + processError.stdout?.toString());
						outputChannel.appendLine('Error while executing "' + execString + '"!\nerror dump:\n' + processError.stdout?.toString());

						vscode.window.showErrorMessage('You can\'t format a file with broken syntax! Fix syntax before formatting file! Check output to see error!');
						outputChannel.show();
					}
					else {
						console.error('Error while executing "' + execString + '"!\nerror dump:\n' + err);
						outputChannel.appendLine('Error while executing "' + execString + '"!\nerror dump:\n' + err);
						vscode.window.showErrorMessage('Error while executing "' + execString + '"!\nerror dump:\n' + err);
					}

					return edits;
				}

				edits.push(vscode.TextEdit.replace(fullRange, formattedFile.toString()));

				return edits;
			}
		})
	);
}

export function deactivate(): void {

}