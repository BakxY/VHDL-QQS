import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as cp from 'child_process';
import * as entityUtils from './lib/EntityUtils';
import * as testbenchCommands from './lib/TestbenchCommand';
import * as tomlUtils from './lib/TomlUtils'
import * as quartus from './lib/QuartusUtils'
import * as compileCommands from './lib/CompileCommand';
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

		const selectedExpression: string | null = entityUtils.getSelectedExpression(editor);
		if (selectedExpression == null) { return; }

		testbenchCommands.createNewTestbench(context, selectedExpression);
	});
	context.subscriptions.push(disposable);

	/**
	 * @brief Command generates a new testbench for a entity. This commands uses the toml file to get available entities and present the user with a menu selection.
	 * @author BakxY
	 */
	var disposable = vscode.commands.registerCommand('vhdl-qqs.generateTestBenchExplorer', async () => {
		// Get toml file path set in vs code setting
		const pathToToml = pathUtils.getTomlLocalPath()
		if (pathToToml == null) { return; }

		// Get all entities listed in toml file
		const allEntities = tomlUtils.getAllEntities(pathUtils.getWorkspacePath()!, pathToToml);
		if (allEntities == null) { return; }

		// Remove file extensions
		for (let entity = 0; entity < allEntities.length; entity++) {
			allEntities[entity] = path.basename(allEntities[entity]).replace(path.extname(allEntities[entity]), '');
		}

		// Ask user to pick a entity
		const selectedEntity: string | undefined = await vscode.window.showQuickPick(allEntities, { title: 'Select a entity to create a testbench' });
		if (selectedEntity == undefined) { return; }

		// Check if a testbench was selected to create a testbench
		if (selectedEntity.endsWith('_tb')) {
			vscode.window.showErrorMessage('Can\'t create a testbench of a testbench!');
			console.error('Can\'t create a testbench of a testbench!');
			return;
		}

		// Check if testbench for selected entity already exists
		if (allEntities.includes(selectedEntity + '_tb')) {
			vscode.window.showErrorMessage('The testbench for this entity already exists!');
			console.error('The testbench for this entity already exists!');
			return;
		}

		testbenchCommands.createNewTestbench(context, selectedEntity);
	});
	context.subscriptions.push(disposable);

	/**
	 * @brief Command sets the currently selected project for the current workspace.
	 * @author BakxY
	 */
	var disposable = vscode.commands.registerCommand('vhdl-qqs.selectCurrentProject', async () => {
		const allProjectFiles: string[] = quartus.getAllProjectFiles();

		// Check if there are any quartus project file are in current workspace
		if (allProjectFiles.length == 0) {
			vscode.window.showErrorMessage('There are no project in your workfolder!');
			console.error('There are no project in your workfolder!');
			return;
		}

		// Ask user to select a project
		const selectedProject: string | undefined = await vscode.window.showQuickPick(allProjectFiles, { title: 'Select a project' });
		if (selectedProject == undefined) { return; }

		// Update UI elements and update workspace storage
		context.workspaceState.update('vhdl-qqs.currentActiveProject', selectedProject);
		currentProjectDisplay.text = 'Project: ' + path.basename(selectedProject).replace(path.extname(selectedProject), '');

		// Get currently active project
		const activeProject: string | null = await pathUtils.getCurrentProject(context);
		if (activeProject == null) { return; }

		// Get  quartus install bin path
		const quartusPath: string | null = await pathUtils.getQuartusBinPath();
		if (quartusPath == null) { return; }

		quartusProjectFilesView.updateData(context, activeProject, quartusPath);
		quartusProjectPropertiesView.updateData(context, activeProject, quartusPath);
	});
	context.subscriptions.push(disposable);

	/**
	 * @brief Commands created and runs a tcl script in the quartus tcl shell that will compile the currently active project.
	 * @author BakxY
	 */
	var disposable = vscode.commands.registerCommand('vhdl-qqs.compileCurrentProject', async () => {
		// Get currently active project
		const activeProject: string | null = await pathUtils.getCurrentProject(context);
		if (activeProject == null) { return; }

		// Get  quartus install bin path
		const quartusPath: string | null = await pathUtils.getQuartusBinPath();
		if (quartusPath == null) { return; }

		// Run compile command
		compileCommands.compileQuartusProject(context, activeProject, path.normalize(quartusPath));
	});
	context.subscriptions.push(disposable);

	/**
	 * @brief Command cleans files that were generated by the compilation of a quartus project.
	 * @author BakxY
	 */
	var disposable = vscode.commands.registerCommand('vhdl-qqs.cleanCompileFiles', async () => {
		// Get currently active project
		const activeProject: string | null = await pathUtils.getCurrentProject(context);
		if (activeProject == null) { return; }

		// Create full folder path
		const folderToClean = path.join(pathUtils.getWorkspacePath()!, path.dirname(activeProject));

		// Try to delete folders
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

		vscode.window.showInformationMessage('Finished cleaning project output files!');
		console.log('Finished cleaning project output files!');
	});
	context.subscriptions.push(disposable);

	/**
	 * @brief Command opens the quartus fpga programmer for the currently active and compiled project
	 * @author BakxY
	 */
	var disposable = vscode.commands.registerCommand('vhdl-qqs.openProgrammerActiveProject', async () => {
		// Get currently active project
		const activeProject: string | null = await pathUtils.getCurrentProject(context);
		if (activeProject == null) { return; }

		// Get  quartus install bin path
		const quartusPath: string | null = await pathUtils.getQuartusBinPath();
		if (quartusPath == null) { return; }

		// Create full path for programming file
		const fileToUpload = path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, path.dirname(activeProject), 'output_files', path.basename(activeProject).replace(path.extname(activeProject), '') + '.sof');

		// check if file exists (if project was compiled)
		if (!fs.existsSync(fileToUpload)) {
			vscode.window.showErrorMessage('No compiled project found! Compile project before opening programmer!');
			console.error('No compiled project found! Compile project before opening programmer!');
			return;
		}

		// Create full programmer binary path
		const programmerFilePath = path.join(path.normalize(quartusPath), 'quartus_pgmw');

		// Start programmer
		cp.exec('"' + programmerFilePath + '" "' + fileToUpload + '"');

		vscode.window.showInformationMessage('Opening programmer for project "' + path.basename(activeProject).replace(path.extname(activeProject), '') + '"');
	});
	context.subscriptions.push(disposable);

	/**
	 * @brief Command opens the quartus rtl viewer for currently active project
	 * @author BakxY
	 */
	var disposable = vscode.commands.registerCommand('vhdl-qqs.openRtlViewerActiveProject', async () => {
		// Get currently active project
		const activeProject: string | null = await pathUtils.getCurrentProject(context);
		if (activeProject == null) { return; }

		// Get  quartus install bin path
		const quartusPath: string | null = await pathUtils.getQuartusBinPath();
		if (quartusPath == null) { return; }

		// Create full path for programming file
		const fileToOpen = path.join(pathUtils.getWorkspacePath()!, path.dirname(activeProject), path.basename(activeProject));

		// check if file exists (if project was compiled)
		if (!fs.existsSync(fileToOpen)) {
			vscode.window.showErrorMessage('Project file doesn\'t exits! Please open a valid project!');
			console.error('Project file doesn\'t exits! Please open a valid project!');
			return;
		}

		// Create full programmer binary path
		const rtlViewerFilePath = path.join(path.normalize(quartusPath), 'qnui');

		// Start programmer
		cp.exec('"' + rtlViewerFilePath + '" "' + fileToOpen + '"');

		vscode.window.showInformationMessage('Opening RTL Viewer for project "' + path.basename(activeProject).replace(path.extname(activeProject), '') + '"');
	});
	context.subscriptions.push(disposable);

	/**
	 * @brief Command changes the current top level entity file of the active project.
	 * @author BakxY
	 */
	var disposable = vscode.commands.registerCommand('vhdl-qqs.changeTopLevel', async () => {
		// Get currently active project
		const activeProject: string | null = await pathUtils.getCurrentProject(context);
		if (activeProject == null) { return; }

		// Get  quartus install bin path
		const quartusPath: string | null = await pathUtils.getQuartusBinPath();
		if (quartusPath == null) { return; }

		// Get toml file path set in vs code setting
		const pathToToml = pathUtils.getTomlLocalPath()
		if (pathToToml == null) { return; }

		// Get all entities listed in toml file
		const allEntities = tomlUtils.getAllEntities(pathUtils.getWorkspacePath()!, pathToToml);
		if (allEntities == null) { return; }

		// Remove file extensions
		for (let entity = 0; entity < allEntities.length; entity++) {
			allEntities[entity] = path.basename(allEntities[entity]).replace(path.extname(allEntities[entity]), '');
		}

		// Ask user to pick a entity
		const newTopLevel: string | undefined = await vscode.window.showQuickPick(allEntities, { title: 'Select new top level entity' });
		if (newTopLevel == undefined) { return; }

		// Update UI elements and update workspace storage
		quartus.setProjectTopLevel(context, activeProject, quartusPath, newTopLevel);
		currentTopLevelDisplay.text = 'Top Level: ' + newTopLevel;
	});
	context.subscriptions.push(disposable);

	/**
	 * @brief TODO
	 * @author BakxY
	 */
	var disposable = vscode.commands.registerCommand('vhdl-qqs.addFileToProject', async (uri: vscode.Uri) => {
		const filePath: string = path.normalize(uri.fsPath);
		if (!['.vhd', '.v'].includes(path.extname(filePath))) { return; }

		// Get currently active project
		const activeProject: string | null = await pathUtils.getCurrentProject(context);
		if (activeProject == null) { return; }

		// Get  quartus install bin path
		const quartusPath: string | null = await pathUtils.getQuartusBinPath();
		if (quartusPath == null) { return; }

		const relativePath = path.relative(path.dirname(path.join(pathUtils.getWorkspacePath()!, activeProject)), filePath).replaceAll('\\', '/');

		switch (path.extname(filePath)) {
			case '.vhd':
				const allVhdlFiles = quartus.getProjectVhdlSourceFiles(context, activeProject, quartusPath);
				if (allVhdlFiles.includes(relativePath)) {
					vscode.window.showInformationMessage('File is already part of active project!');
					return;
				}
				quartus.addVhdlFileToProject(context, activeProject, quartusPath, relativePath);
				break;

			case '.v':
				const allVerilogFiles = quartus.getProjectVerilogSourceFiles(context, activeProject, quartusPath);
				if (allVerilogFiles.includes(relativePath)) {
					vscode.window.showInformationMessage('File is already part of active project!');
					return;
				}
				quartus.addVerilogFileToProject(context, activeProject, quartusPath, relativePath);
				break;
		}
		quartusProjectFilesView.updateData(context, activeProject, quartusPath);
		vscode.window.showInformationMessage('Added file to active project!');
	});
	context.subscriptions.push(disposable);

	/**
	 * @brief TODO
	 * @author BakxY
	 */
	var disposable = vscode.commands.registerCommand('vhdl-qqs.removeFileToProject', async (uri: vscode.Uri) => {
		const filePath: string = path.normalize(uri.fsPath);
		if (!['.vhd', '.v'].includes(path.extname(filePath))) { return; }

		// Get currently active project
		const activeProject: string | null = await pathUtils.getCurrentProject(context);
		if (activeProject == null) { return; }

		// Get  quartus install bin path
		const quartusPath: string | null = await pathUtils.getQuartusBinPath();
		if (quartusPath == null) { return; }

		const relativePath = path.relative(path.dirname(path.join(pathUtils.getWorkspacePath()!, activeProject)), filePath).replaceAll('\\', '/');

		switch (path.extname(filePath)) {
			case '.vhd':
				const allVhdlFiles = quartus.getProjectVhdlSourceFiles(context, activeProject, quartusPath);
				if (!allVhdlFiles.includes(relativePath)) {
					vscode.window.showInformationMessage('Was\'t part of project!');
					return;
				}
				quartus.removeVhdlFileToProject(context, activeProject, quartusPath, relativePath);
				break;

			case '.v':
				const allVerilogFiles = quartus.getProjectVerilogSourceFiles(context, activeProject, quartusPath);
				if (!allVerilogFiles.includes(relativePath)) {
					vscode.window.showInformationMessage('Was\'t part of project!');
					return;
				}
				quartus.removeVerilogFileToProject(context, activeProject, quartusPath, relativePath);
				break;
		}
		quartusProjectFilesView.updateData(context, activeProject, quartusPath);
		vscode.window.showInformationMessage('Removed file to active project!');
	});
	context.subscriptions.push(disposable);

	let currentTopLevelDisplay = await statusBarCreator.createChangeTopLevel(context);
	context.subscriptions.push(currentTopLevelDisplay);

	let currentProjectDisplay = statusBarCreator.createActiveProject(context);
	context.subscriptions.push(currentProjectDisplay);

	context.subscriptions.push(statusBarCreator.createCleanProject());
	context.subscriptions.push(statusBarCreator.createCompileProject());
	context.subscriptions.push(statusBarCreator.createOpenProgrammer());

	// Get currently active project
	const activeProject: string | null = await pathUtils.getCurrentProject(context);
	if (activeProject == null) { return; }

	// Get  quartus install bin path
	const quartusPath: string | null = await pathUtils.getQuartusBinPath();
	if (quartusPath == null) { return; }

	const quartusProjectFilesView = new quartus.QuartusProjectFileTreeDataProvider();
	vscode.window.createTreeView('projectSourceFiles', { treeDataProvider: quartusProjectFilesView });
	quartusProjectFilesView.updateData(context, activeProject, quartusPath);

	const quartusProjectPropertiesView = new quartus.QuartusProjectPropertiesTreeDataProvider();
	vscode.window.createTreeView('projectProperties', { treeDataProvider: quartusProjectPropertiesView });
	quartusProjectPropertiesView.updateData(context, activeProject, quartusPath);
}

export function deactivate() {

}