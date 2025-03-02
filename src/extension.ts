import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as cp from 'child_process';
import { getSelectedExpression } from './lib/EntityUtils';
import { createNewTestbench } from './lib/TestbenchCommand';
import { getAllEntities } from './lib/TomlUtils'
import { getAllProjectFiles, checkForQuartusInstallation, getProjectGlobal } from './lib/QuartusUtils'
import { compileQuartusProject } from './lib/CompileCommand';

export function activate(context: vscode.ExtensionContext) {
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

	var disposable = vscode.commands.registerCommand('vhdl-qqs.selectCurrentProject', async () => {
		const allProjectFiles: string[] = getAllProjectFiles();

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

	var disposable = vscode.commands.registerCommand('vhdl-qqs.compileCurrentProject', async () => {
		const activeProject = context.workspaceState.get('vhdl-qqs.currentActiveProject', undefined);

		if (activeProject == undefined) {
			vscode.window.showErrorMessage('No project selected! Select a project before compiling!');
			console.error('No project selected! Select a project before compiling!');
			return;
		}

		const quartusPath = await vscode.workspace.getConfiguration('vhdl-qqs').get<string>('quartusBinPath');

		if (quartusPath == undefined) {
			vscode.window.showErrorMessage('No quartus installation folder defined in settings!');
			console.error('No quartus installation folder defined in settings!');
			return;
		}

		if (!checkForQuartusInstallation(path.normalize(quartusPath))) {
			vscode.window.showErrorMessage('No quartus installation at provided path! Check your settings!');
			console.error('No quartus installation at provided path! Check your settings!');
			return;
		}

		compileQuartusProject(context, path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, activeProject), path.normalize(quartusPath));
	});
	context.subscriptions.push(disposable);

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

	var disposable = vscode.commands.registerCommand('vhdl-qqs.openProgrammerActiveProject', async () => {
		const activeProject = context.workspaceState.get('vhdl-qqs.currentActiveProject', undefined);

		if (activeProject == undefined) {
			vscode.window.showErrorMessage('No project selected! Select a project before compiling!');
			console.error('No project selected! Select a project before compiling!');
			return;
		}

		const quartusPath = await vscode.workspace.getConfiguration('vhdl-qqs').get<string>('quartusBinPath');

		if (quartusPath == undefined) {
			vscode.window.showErrorMessage('No quartus installation folder defined in settings!');
			console.error('No quartus installation folder defined in settings!');
			return;
		}

		if (!checkForQuartusInstallation(path.normalize(quartusPath))) {
			vscode.window.showErrorMessage('No quartus installation at provided path! Check your settings!');
			console.error('No quartus installation at provided path! Check your settings!');
			return;
		}

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

	var disposable = vscode.commands.registerCommand('vhdl-qqs.devCommand', async () => {
		getProjectGlobal('FAMILY');
	});
	context.subscriptions.push(disposable);

	var disposable = vscode.commands.registerCommand('vhdl-qqs.changeTopLevel', async () => {
		const activeProject: string | undefined = context.workspaceState.get('vhdl-qqs.currentActiveProject', undefined);

		if (activeProject == undefined) {
			vscode.window.showErrorMessage('No project selected! Select a project before compiling!');
			console.error('No project selected! Select a project before compiling!');
			return;
		}

		const pathToProjectFile = path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, activeProject).replace('.qpf', '.qsf');

		if (!fs.existsSync(pathToProjectFile)) {
			vscode.window.showErrorMessage('Project files doesn\'t exists! Please reselect your project!');
			console.error('Project files doesn\'t exists! Please reselect your project!');
			return;
		}

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

		let projectFileContent = fs.readFileSync(pathToProjectFile, 'utf-8').split('\n');

		for(let lineIndex = 0; lineIndex < projectFileContent.length; lineIndex++)
		{
			if(projectFileContent[lineIndex].includes('set_global_assignment -name TOP_LEVEL_ENTITY'))
			{
				projectFileContent[lineIndex] = 'set_global_assignment -name TOP_LEVEL_ENTITY ' + newTopLevel;
				break;
			}
		}

		fs.writeFileSync(pathToProjectFile, projectFileContent.join("\n"), 'utf-8');
	});
	context.subscriptions.push(disposable);

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
	context.subscriptions.push(currentProjectDisplay);
	currentProjectDisplay.show();

	let currentTopLevelDisplay = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 11);
	currentTopLevelDisplay.command = 'vhdl-qqs.changeTopLevel';
	currentTopLevelDisplay.text = '$(file-code)';
	currentTopLevelDisplay.tooltip = 'Change current top level entity of quartus project';
	context.subscriptions.push(currentTopLevelDisplay);
	currentTopLevelDisplay.show();

	let compileProjectButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);
	compileProjectButton.command = 'vhdl-qqs.compileCurrentProject';
	compileProjectButton.text = '$(play)';
	compileProjectButton.tooltip = 'Compile the currently selected quartus project';
	context.subscriptions.push(compileProjectButton);
	compileProjectButton.show();

	let cleanCompileFilesButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);
	cleanCompileFilesButton.command = 'vhdl-qqs.cleanCompileFiles';
	cleanCompileFilesButton.text = '$(trash)';
	cleanCompileFilesButton.tooltip = 'Cleanup files from previous quartus compilation';
	context.subscriptions.push(cleanCompileFilesButton);
	cleanCompileFilesButton.show();

	let openProgrammerButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);
	openProgrammerButton.command = 'vhdl-qqs.openProgrammerActiveProject';
	openProgrammerButton.text = '$(flame)';
	openProgrammerButton.tooltip = 'Open quartus programmer on active compiled project';
	context.subscriptions.push(openProgrammerButton);
	openProgrammerButton.show();
}

export function deactivate() {

}
