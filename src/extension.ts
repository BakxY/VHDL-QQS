import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as cp from 'child_process';
import { getSelectedExpression } from './lib/EntityUtils';
import { createNewTestbench } from './lib/TestbenchCommand';
import { getAllEntities } from './lib/TomlUtils'
import * as quartus from './lib/QuartusUtils'
import { compileQuartusProject } from './lib/CompileCommand';
import * as statusBarCreator from './lib/StatusBarUtils';
import * as pathUtils from './lib/PathUtils'

export async function activate(context: vscode.ExtensionContext) {
	/**
	 * @brief Command generates a new testbench for a entity. This commands uses the user selected expression as the entity to generate the testbench for.
	 * @author BakxY
	 */
	var disposable = vscode.commands.registerCommand('vhdl-qqs.generateTestBenchSelection', () => {
		const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;

		// Check if editor is opened
		if (editor == undefined) {
			vscode.window.showErrorMessage('No editor opened!');
			console.error('No editor opened!');
			return;
		}

		console.log('Found current open file "' + editor.document.fileName + '"');

		const selectedExpression: string | null = getSelectedExpression(editor);

		if (!selectedExpression) {
			// Error message is printed in function
			return;
		}

		createNewTestbench(context, selectedExpression);
	});
	context.subscriptions.push(disposable);

	/**
	 * @brief Command generates a new testbench for a entity. This commands uses the toml file to get available entities and present the user with a menu selection.
	 * @author BakxY
	 */
	var disposable = vscode.commands.registerCommand('vhdl-qqs.generateTestBenchExplorer', async () => {
		const pathToToml = vscode.workspace.getConfiguration('vhdl-qqs').get<string>('tomlPath');

		if (pathToToml == undefined) {
			vscode.window.showErrorMessage('No path for toml file set! Please change in settings!');
			console.error('No path for toml file set! Please change in settings!');
			return;
		}

		const allEntities = getAllEntities(vscode.workspace.workspaceFolders![0].uri.fsPath, pathToToml);

		if (!allEntities) {
			// Error message is printed in function
			return;
		}

		for (let entity = 0; entity < allEntities.length; entity++) {
			allEntities[entity] = path.basename(allEntities[entity]).replace('.vhd', '');
		}

		const selectedEntity: string | undefined = await vscode.window.showQuickPick(allEntities, { title: 'Select a entity to create a testbench' });

		if (selectedEntity == undefined) {
			return;
		}

		if (selectedEntity.endsWith('_tb')) {
			vscode.window.showErrorMessage('Can\'t create a testbench of a testbench!');
			console.error('Can\'t create a testbench of a testbench!');
			return;
		}

		if (allEntities.includes(selectedEntity + '_tb')) {
			vscode.window.showErrorMessage('The testbench for this entity already exists!');
			console.error('The testbench for this entity already exists!');
			return;
		}

		createNewTestbench(context, selectedEntity);
	});
	context.subscriptions.push(disposable);

	/**
	 * @brief Command sets the currently selected project for the current workspace.
	 * @author BakxY
	 */
	var disposable = vscode.commands.registerCommand('vhdl-qqs.selectCurrentProject', async () => {
		const allProjectFiles: string[] = quartus.getAllProjectFiles();

		if (allProjectFiles.length == 0) {
			vscode.window.showErrorMessage('There are no project in your workfolder!');
			console.error('There are no project in your workfolder!');
			return;
		}

		const selectedProject: string | undefined = await vscode.window.showQuickPick(allProjectFiles, { title: 'Select a project' });

		if (selectedProject == undefined) {
			return;
		}

		context.workspaceState.update('vhdl-qqs.currentActiveProject', selectedProject);
		currentProjectDisplay.text = 'Project: ' + path.basename(selectedProject).replace(path.extname(selectedProject), '');
	});
	context.subscriptions.push(disposable);

	/**
	 * @brief Commands created and runs a tcl script in the quartus tcl shell that will compile the currently active project.
	 * @author BakxY
	 */
	var disposable = vscode.commands.registerCommand('vhdl-qqs.compileCurrentProject', async () => {
		const activeProject: string | null = await pathUtils.getCurrentProject(context);
		if(activeProject == null) { return; }

		const quartusPath: string | null = await pathUtils.getQuartusBinPath();
		if(quartusPath == null) { return; }

		compileQuartusProject(context, path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, activeProject), path.normalize(quartusPath));
	});
	context.subscriptions.push(disposable);

	/**
	 * @brief Command cleans files that were generated by the compilation of a quartus project.
	 * @author BakxY
	 */
	var disposable = vscode.commands.registerCommand('vhdl-qqs.cleanCompileFiles', () => {
		const activeProject = context.workspaceState.get('vhdl-qqs.currentActiveProject', undefined);

		if (activeProject == undefined) {
			vscode.window.showErrorMessage('No project selected! Select a project before compiling!');
			console.error('No project selected! Select a project before compiling!');
			return;
		}

		const folderToClean = path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, path.dirname(activeProject));

		try {
			fs.rmSync(path.join(folderToClean, 'output_files'), { recursive: true })
		}
		catch (err) {
			console.warn(err)
		}

		try {
			fs.rmSync(path.join(folderToClean, 'db'), { recursive: true })
		}
		catch (err) {
			console.warn(err)
		}

		try {
			fs.rmSync(path.join(folderToClean, 'incremental_db'), { recursive: true })
		}
		catch (err) {
			console.warn(err)
		}
	});
	context.subscriptions.push(disposable);

	/**
	 * @brief Command opens the quartus fpga programmer for the currently active and compiled project
	 * @author BakxY
	 */
	var disposable = vscode.commands.registerCommand('vhdl-qqs.openProgrammerActiveProject', async () => {
		const activeProject: string | null = await pathUtils.getCurrentProject(context);
		if(activeProject == null) { return; }

		const quartusPath: string | null = await pathUtils.getQuartusBinPath();
		if(quartusPath == null) { return; }

		const fileToUpload = path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, path.dirname(activeProject), 'output_files', path.basename(activeProject).replace(path.extname(activeProject), '') + '.sof');

		if (!fs.existsSync(fileToUpload)) {
			vscode.window.showErrorMessage('No compiled project found! Compile project before opening programmer!');
			console.error('No compiled project found! Compile project before opening programmer!');
			return;
		}

		const programmerFilePath = path.join(path.normalize(quartusPath), 'quartus_pgmw');

		cp.exec('"' + programmerFilePath + '" "' + fileToUpload + '"');

		vscode.window.showInformationMessage('Opening programmer for project "' + path.basename(activeProject).replace(path.extname(activeProject), '') + '"');
	});
	context.subscriptions.push(disposable);

	/**
	 * @brief Command changes the current top level entity file of the active project.
	 * @author BakxY
	 */
	var disposable = vscode.commands.registerCommand('vhdl-qqs.changeTopLevel', async () => {
		const activeProject: string | null = await pathUtils.getCurrentProject(context);
		if(activeProject == null) { return; }

		const quartusPath: string | null = await pathUtils.getQuartusBinPath();
		if(quartusPath == null) { return; }

		const pathToToml = vscode.workspace.getConfiguration('vhdl-qqs').get<string>('tomlPath');

		if (pathToToml == undefined) {
			vscode.window.showErrorMessage('No path for toml file set! Please change in settings!');
			console.error('No path for toml file set! Please change in settings!');
			return;
		}

		const allEntities = getAllEntities(vscode.workspace.workspaceFolders![0].uri.fsPath, pathToToml);

		if (!allEntities) {
			// Error message is printed in function
			return;
		}

		for (let entity = 0; entity < allEntities.length; entity++) {
			allEntities[entity] = path.basename(allEntities[entity]).replace('.vhd', '');
		}

		const newTopLevel: string | undefined = await vscode.window.showQuickPick(allEntities, { title: 'Select new top level entity' });

		if (newTopLevel == undefined) {
			return;
		}

		quartus.setProjectTopLevel(context, activeProject, quartusPath, newTopLevel);

		currentTopLevelDisplay.text = 'Top Level: ' + newTopLevel;
	});
	context.subscriptions.push(disposable);

	let currentTopLevelDisplay = await statusBarCreator.createChangeTopLevel(context);
	context.subscriptions.push(currentTopLevelDisplay);

	let currentProjectDisplay = statusBarCreator.createActiveProject(context);
	context.subscriptions.push(currentProjectDisplay);

	context.subscriptions.push(statusBarCreator.createCleanProject());
	context.subscriptions.push(statusBarCreator.createCompileProject());
	context.subscriptions.push(statusBarCreator.createOpenProgrammer());
}

export function deactivate() {

}
