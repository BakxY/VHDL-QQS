import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as cp from 'child_process';
import * as entityUtils from './lib/EntityUtils';
import * as testbenchCommands from './lib/TestbenchCommand';
import * as tomlUtils from './lib/TomlUtils';
import * as quartus from './lib/QuartusUtils';
import * as questa from './lib/QuestaUtils';
import * as compileCommands from './lib/CompileCommand';
import * as testCommands from './lib/TestCommands'
import * as statusBarCreator from './lib/StatusBarUtils';
import * as pathUtils from './lib/PathUtils';

export async function activate(context: vscode.ExtensionContext) {
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
	var disposable = vscode.commands.registerCommand('vhdl-qqs.generateTestBenchSelection', () => {
		const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;

		// Check if editor is opened
		if (editor === undefined) {
			vscode.window.showErrorMessage('No editor opened!');
			console.error('No editor opened!');
			return;
		}

		console.log('Found current open file "' + editor.document.fileName + '"');

		const selectedExpression: string | null = entityUtils.getSelectedExpression(editor);
		if (selectedExpression === null) { return; }

		testbenchCommands.createNewTestbench(context, selectedExpression);
	});
	context.subscriptions.push(disposable);

	/**
	 * @brief Command generates a new testbench for a entity. This commands uses the toml file to get available entities and present the user with a menu selection.
	 * @author BakxY
	 */
	var disposable = vscode.commands.registerCommand('vhdl-qqs.generateTestBenchExplorer', async () => {
		// Get toml file path set in vs code setting
		const pathToToml = pathUtils.getTomlLocalPath();
		if (pathToToml === null) { return; }

		// Get all entities listed in toml file
		const allEntities = tomlUtils.getAllEntities(pathUtils.getWorkspacePath()!, pathToToml);
		if (allEntities === null) { return; }

		// Remove file extensions
		for (let entity = 0; entity < allEntities.length; entity++) {
			allEntities[entity] = path.basename(allEntities[entity]).replace(path.extname(allEntities[entity]), '');
		}

		// Ask user to pick a entity
		const selectedEntity: string | undefined = await vscode.window.showQuickPick(allEntities, { title: 'Select a entity to create a testbench' });
		if (selectedEntity === undefined) { return; }

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
	var disposable = vscode.commands.registerCommand('vhdl-qqs.selectQuartusProject', async () => {
		const allProjectFiles: string[] = quartus.getAllProjectFiles();

		// Check if there are any quartus project file are in current workspace
		if (allProjectFiles.length === 0) {
			vscode.window.showErrorMessage('There are no project in your workfolder!');
			console.error('There are no project in your workfolder!');
			return;
		}

		// Ask user to select a project
		const selectedProject: string | undefined = await vscode.window.showQuickPick(allProjectFiles, { title: 'Select a project' });
		if (selectedProject === undefined) { return; }

		// Update UI elements and update workspace storage
		context.workspaceState.update('vhdl-qqs.currentActiveQuartusProject', selectedProject);
		currentQuartusProjectDisplay.text = 'Quartus: ' + path.basename(selectedProject).replace(path.extname(selectedProject), '');

		// Get currently active project
		const activeProject: string | null = await pathUtils.getCurrentQuartusProject(context);
		if (activeProject === null) { return; }

		// Get  quartus install bin path
		const quartusPath: string | null = await pathUtils.getQuartusBinPath();
		if (quartusPath === null) { return; }

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
		const activeProject: string | null = await pathUtils.getCurrentQuartusProject(context);
		if (activeProject === null) { return; }

		// Get  quartus install bin path
		const quartusPath: string | null = await pathUtils.getQuartusBinPath();
		if (quartusPath === null) { return; }

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
		const activeProject: string | null = await pathUtils.getCurrentQuartusProject(context);
		if (activeProject === null) { return; }

		// Create full folder path
		const folderToClean = path.join(pathUtils.getWorkspacePath()!, path.dirname(activeProject));

		// Try to delete folders
		try {
			fs.rmSync(path.join(folderToClean, 'output_files'), { recursive: true });
		}
		catch (err) {
			console.warn(err);
		}

		try {
			fs.rmSync(path.join(folderToClean, 'db'), { recursive: true });
		}
		catch (err) {
			console.warn(err);
		}

		try {
			fs.rmSync(path.join(folderToClean, 'incremental_db'), { recursive: true });
		}
		catch (err) {
			console.warn(err);
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
		const activeProject: string | null = await pathUtils.getCurrentQuartusProject(context);
		if (activeProject === null) { return; }

		// Get  quartus install bin path
		const quartusPath: string | null = await pathUtils.getQuartusBinPath();
		if (quartusPath === null) { return; }

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
		const activeProject: string | null = await pathUtils.getCurrentQuartusProject(context);
		if (activeProject === null) { return; }

		// Get  quartus install bin path
		const quartusPath: string | null = await pathUtils.getQuartusBinPath();
		if (quartusPath === null) { return; }

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
		const activeProject: string | null = await pathUtils.getCurrentQuartusProject(context);
		if (activeProject === null) { return; }

		// Get  quartus install bin path
		const quartusPath: string | null = await pathUtils.getQuartusBinPath();
		if (quartusPath === null) { return; }

		// Get toml file path set in vs code setting
		const pathToToml = pathUtils.getTomlLocalPath();
		if (pathToToml === null) { return; }

		// Get all entities listed in toml file
		const allEntities = tomlUtils.getAllEntities(pathUtils.getWorkspacePath()!, pathToToml);
		if (allEntities === null) { return; }

		// Remove file extensions
		for (let entity = 0; entity < allEntities.length; entity++) {
			allEntities[entity] = path.basename(allEntities[entity]).replace(path.extname(allEntities[entity]), '');
		}

		// Ask user to pick a entity
		const newTopLevel: string | undefined = await vscode.window.showQuickPick(allEntities, { title: 'Select new top level entity' });
		if (newTopLevel === undefined) { return; }

		// Update UI elements and update workspace storage
		quartus.setProjectTopLevel(context, activeProject, quartusPath, newTopLevel);
		currentTopLevelDisplay.text = 'Top Level: ' + newTopLevel;
		vscode.commands.executeCommand('vhdl-qqs.cleanCompileFiles');
	});
	context.subscriptions.push(disposable);

	/**
	 * @brief Command used in context menu to add a file to the current project.
	 * @author BakxY
	 */
	var disposable = vscode.commands.registerCommand('vhdl-qqs.addFileToProjectContext', async (uri: vscode.Uri) => {
		const filePath: string = path.normalize(uri.fsPath);
		if (!['.vhd', '.v'].includes(path.extname(filePath))) { return; }

		// Get currently active project
		const activeProject: string | null = await pathUtils.getCurrentQuartusProject(context);
		if (activeProject === null) { return; }

		// Get  quartus install bin path
		const quartusPath: string | null = await pathUtils.getQuartusBinPath();
		if (quartusPath === null) { return; }

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
	 * @brief Command used in context menu to remove a file from the current project.
	 * @author BakxY
	 */
	var disposable = vscode.commands.registerCommand('vhdl-qqs.removeFileFromProjectContext', async (uri: vscode.Uri) => {
		const filePath: string = path.normalize(uri.fsPath);
		if (!['.vhd', '.v'].includes(path.extname(filePath))) { return; }

		// Get currently active project
		const activeProject: string | null = await pathUtils.getCurrentQuartusProject(context);
		if (activeProject === null) { return; }

		// Get  quartus install bin path
		const quartusPath: string | null = await pathUtils.getQuartusBinPath();
		if (quartusPath === null) { return; }

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
		vscode.window.showInformationMessage('Removed file from active project!');
	});
	context.subscriptions.push(disposable);

	/**
	 * @brief Command used to remove a file from the current project by a user menu selection.
	 * @author BakxY
	 */
	var disposable = vscode.commands.registerCommand('vhdl-qqs.removeFileFromProject', async () => {
		// Get currently active project
		const activeProject: string | null = await pathUtils.getCurrentQuartusProject(context);
		if (activeProject === null) { return; }

		// Get  quartus install bin path
		const quartusPath: string | null = await pathUtils.getQuartusBinPath();
		if (quartusPath === null) { return; }

		let allProjectFiles: string[] = [];

		allProjectFiles = allProjectFiles.concat(quartus.getProjectVhdlSourceFiles(context, activeProject, quartusPath));
		allProjectFiles = allProjectFiles.concat(quartus.getProjectVerilogSourceFiles(context, activeProject, quartusPath));

		// Ask user to pick a entity
		const fileToRemove: string | undefined = await vscode.window.showQuickPick(allProjectFiles, { title: 'Select a file to remove from project' });
		if (fileToRemove === undefined) { return; }

		switch (path.extname(fileToRemove)) {
			case '.vhd':
				quartus.removeVhdlFileToProject(context, activeProject, quartusPath, fileToRemove);
				break;

			case '.v':
				quartus.removeVerilogFileToProject(context, activeProject, quartusPath, fileToRemove);
				break;
		}

		quartusProjectFilesView.updateData(context, activeProject, quartusPath);
		vscode.window.showInformationMessage('Removed file to active project!');
	});
	context.subscriptions.push(disposable);

	/**
	 * @brief Command used to refresh the data displayed in Quartus Source File list.
	 * @author BakxY
	 */
	var disposable = vscode.commands.registerCommand('vhdl-qqs.refreshSourceFiles', async () => {
		// Get currently active project
		const activeProject: string | null = await pathUtils.getCurrentQuartusProject(context);
		if (activeProject === null) { return; }

		// Get  quartus install bin path
		const quartusPath: string | null = await pathUtils.getQuartusBinPath();
		if (quartusPath === null) { return; }

		quartusProjectFilesView.updateData(context, activeProject, quartusPath);
		vscode.window.showInformationMessage('Refreshed source file list!');
	});
	context.subscriptions.push(disposable);

	/**
	 * @brief Command used to create a new entity from a template file
	 * @author BakxY
	 */
	var disposable = vscode.commands.registerCommand('vhdl-qqs.createNewEntity', async () => {
		// Get currently active project
		const activeProject: string | null = await pathUtils.getCurrentQuartusProject(context);
		if (activeProject === null) { return; }

		// Get  quartus install bin path
		const quartusPath: string | null = await pathUtils.getQuartusBinPath();
		if (quartusPath === null) { return; }



		const entityName: string | undefined = await vscode.window.showInputBox({ title: 'Enter the identifier for the new entity' });
		if (entityName === undefined) { return; }

		if (entityName.endsWith('_tb')) {
			vscode.window.showErrorMessage('Entity name can\'t end in "_tp"! Suffix "_tp" is reserved for testbenches!');
			console.error('Entity name can\'t end in "_tp"! Suffix "_tp" is reserved for testbenches!');
			return;
		}

		// Get all files included in the current project
		let allProjectFiles: string[] = [];
		allProjectFiles = allProjectFiles.concat(quartus.getProjectVhdlSourceFiles(context, activeProject, quartusPath));
		allProjectFiles = allProjectFiles.concat(quartus.getProjectVerilogSourceFiles(context, activeProject, quartusPath));

		// Check if there already exits a entity with user specified name
		for (let fileIndex = 0; fileIndex < allProjectFiles.length; fileIndex++) {
			if (path.basename(allProjectFiles[fileIndex]).replace(path.extname(allProjectFiles[fileIndex]), '') === entityName) {
				vscode.window.showErrorMessage('There already exists a entity with the name "' + entityName + '" in current project!');
				console.error('There already exists a entity with the name "' + entityName + '" in current project!');
				return;
			}
		}

		// Ask user where to save the new entity to
		const targetFolder: vscode.Uri[] | undefined = await vscode.window.showOpenDialog({
			canSelectFolders: true,
			canSelectFiles: false,
			canSelectMany: false,
			openLabel: 'Select Folder',
			title: 'Select folder to store the new entity in'
		});
		if (targetFolder === undefined) { return; }

		const targetFilePath = path.join(targetFolder[0].fsPath, entityName + '.vhd');

		// Check if file already exists
		if (fs.existsSync(targetFilePath)) {
			vscode.window.showErrorMessage('Target file already exists at "' + targetFilePath + '"');
			console.error('Target file already exists at "' + targetFilePath + '"');
			return;
		}

		// Generate entire path for template file
		const PATH_TO_ENTITY_TEMPLATE: string = path.join(context.extensionPath, 'res', 'entity_template.vhd');
		console.log('Loading template file from "' + PATH_TO_ENTITY_TEMPLATE + '"');

		let generatedEntity: string = fs.readFileSync(PATH_TO_ENTITY_TEMPLATE, 'utf-8');

		// Populate template
		generatedEntity = generatedEntity.replaceAll('ENTITY_NAME', entityName);
		generatedEntity = generatedEntity.replaceAll('DATE_CREATED', new Date().toLocaleDateString('de-CH'));

		// Write template to fs
		console.log('Writing template to "' + generatedEntity + '"');
		fs.writeFileSync(targetFilePath, generatedEntity);

		// Add file to project as source file
		const relativePath = path.relative(path.dirname(path.join(pathUtils.getWorkspacePath()!, activeProject)), targetFilePath).replaceAll('\\', '/');
		quartus.addVhdlFileToProject(context, activeProject, quartusPath, relativePath)

		console.log('Finished creation of entity and added to active project as source file!');
		vscode.window.showInformationMessage('Finished creation of entity and added to active project as source file!');
	});
	context.subscriptions.push(disposable);

	/**
	 * @brief Command used to select questa project to run tests for
	 * @author BakxY
	 */
	var disposable = vscode.commands.registerCommand('vhdl-qqs.selectQuestaProject', async () => {
		if (!vscode.workspace.getConfiguration('vhdl-qqs').get('questaFeatureFlag')) {
			vscode.window.showErrorMessage('Feature isn\'t enabled!');
			console.error('Feature isn\'t enabled!');
			return;
		}

		const availableProjects: string[] = questa.getAllProjectFiles();

		// Check if there are any quartus project file are in current workspace
		if (availableProjects.length === 0) {
			vscode.window.showErrorMessage('There are no project in your workfolder!');
			console.error('There are no project in your workfolder!');
			return;
		}

		// Ask user to select a project
		const selectedProject: string | undefined = await vscode.window.showQuickPick(availableProjects, { title: 'Select a project' });
		if (selectedProject === undefined) { return; }

		// Update UI elements and update workspace storage
		context.workspaceState.update('vhdl-qqs.currentActiveQuestaProject', selectedProject);
		currentQuestaProjectDisplay.text = 'Questa: ' + path.basename(selectedProject).replace(path.extname(selectedProject), '');
	});
	context.subscriptions.push(disposable);

	/**
	 * @brief Command used to run tests for selected questa project
	 * @author BakxY
	 */
	var disposable = vscode.commands.registerCommand('vhdl-qqs.runQuestaTest', async () => {
		if (!vscode.workspace.getConfiguration('vhdl-qqs').get('questaFeatureFlag')) {
			vscode.window.showErrorMessage('Feature isn\'t enabled!');
			console.error('Feature isn\'t enabled!');
			return;
		}

		// Get currently active project
		const activeProject: string | null = await pathUtils.getCurrentQuestaProject(context);
		if (activeProject === null) { return; }

		// Get  quartus install bin path
		const quartusPath: string | null = await pathUtils.getQuestaBinPath();
		if (quartusPath === null) { return; }

		testCommands.runQuestaTest(context, activeProject, quartusPath);
	});
	context.subscriptions.push(disposable);

	let currentQuartusProjectDisplay = statusBarCreator.createActiveQuartusProject(context);
	context.subscriptions.push(currentQuartusProjectDisplay);

	let currentTopLevelDisplay = await statusBarCreator.createChangeTopLevel(context);
	context.subscriptions.push(currentTopLevelDisplay);

	context.subscriptions.push(statusBarCreator.createCleanProject());
	context.subscriptions.push(statusBarCreator.createCompileProject());
	context.subscriptions.push(statusBarCreator.createOpenProgrammer());
	context.subscriptions.push(statusBarCreator.createOpenRtlViewer());

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
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
	}));

	let currentQuestaProjectDisplay: vscode.StatusBarItem = statusBarCreator.createActiveQuestaProject(context);
	context.subscriptions.push(currentQuestaProjectDisplay);

	let runQuestaTestsButton: vscode.StatusBarItem = statusBarCreator.createRunTests();
	context.subscriptions.push(runQuestaTestsButton);

	const quartusProjectFilesView = new quartus.QuartusProjectFileTreeDataProvider();
	vscode.window.createTreeView('projectSourceFiles', { treeDataProvider: quartusProjectFilesView });

	const quartusProjectPropertiesView = new quartus.QuartusProjectPropertiesTreeDataProvider();
	vscode.window.createTreeView('projectProperties', { treeDataProvider: quartusProjectPropertiesView });

	// Get currently active project
	const activeProject: string | null = await pathUtils.getCurrentQuartusProject(context);
	if (activeProject !== null) {
		// Get  quartus install bin path
		const quartusPath: string | null = await pathUtils.getQuartusBinPath();
		if (quartusPath !== null) {
			quartusProjectFilesView.updateData(context, activeProject, quartusPath);
			quartusProjectPropertiesView.updateData(context, activeProject, quartusPath);
		}
	}
}

export function deactivate() {

}