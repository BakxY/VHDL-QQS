import * as vscode from 'vscode';
import * as path from 'path';
import { getSelectedExpression } from './lib/EntityUtils';
import { createNewTestbench } from './lib/TestbenchCommand';
import { getAllEntities } from './lib/TomlUtils'
import { getAllProjectFiles, checkForQuartusInstallation } from './lib/QuartusUtils'
import { compileQuartusProject } from './lib/CompileCommand';

let StoreActiveProject: boolean = true;

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

		const allEntities = getAllEntities(pathToToml);

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

		StoreActiveProject = vscode.workspace.getConfiguration('vhdl-qqs').get<boolean>('storeActiveProjectWorkspace') as boolean;

		if (StoreActiveProject == true) {
			context.workspaceState.update('vhdl-qqs.currentActiveProject', selectedProject);
		}
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

		if(quartusPath == undefined)
		{
			vscode.window.showErrorMessage('No quartus installation folder defined in settings!');
			console.error('No quartus installation folder defined in settings!');
			return;
		}

		if(!checkForQuartusInstallation(path.normalize(quartusPath)))
		{
			vscode.window.showErrorMessage('No quartus installation at provided path! Check your settings!');
			console.error('No quartus installation at provided path! Check your settings!');
			return;
		}

		compileQuartusProject(context, path.join(process.cwd(), activeProject), path.normalize(quartusPath));
	});
	context.subscriptions.push(disposable);
}

export function deactivate() {

}
