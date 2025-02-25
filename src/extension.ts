import * as vscode from 'vscode';
import * as path from 'path';
import { getSelectedExpression } from './lib/EntityUtils';
import { createNewTestbench } from './commands';
import { getAllEntities } from './lib/TomlUtils'

const TOML_PATH: string = path.normalize('./vhdl_ls.toml');

export function activate(context: vscode.ExtensionContext) {
	var disposable = vscode.commands.registerCommand('vhdl-qqs.generateTestBenchSelection', () => {
		const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;

		// Check if editor is opened
		if (editor == undefined) {
			vscode.window.showErrorMessage('No editor opened!');
			return;
		}

		const selectedExpression: string | null = getSelectedExpression(editor);

		if (!selectedExpression) {
			// Error message is printed in function
			return;
		}

		createNewTestbench(context, selectedExpression);
	});
	context.subscriptions.push(disposable);

	var disposable = vscode.commands.registerCommand('vhdl-qqs.generateTestBenchExplorer', async () => {
		const allEntities = getAllEntities(TOML_PATH);

		if (!allEntities) {
			// Error message is printed in function
			return;
		}

		for (let entity = 0; entity < allEntities.length; entity++) {
			allEntities[entity] = path.basename(allEntities[entity]).replace('.vhd', '');
		}

		const selectedEntity: string | undefined = await vscode.window.showQuickPick(allEntities, { title: 'Select a entity to create a testbench!' });

		if (selectedEntity == undefined) {
			return;
		}

		if (selectedEntity.endsWith('_tb')) {
			vscode.window.showErrorMessage('Can\'t create a testbench of a testbench!');
			return;
		}

		if (allEntities.includes(selectedEntity + '_tb')) {
			vscode.window.showErrorMessage('The testbench for this entity already exists!');
			return;
		}

		createNewTestbench(context, selectedEntity);
	});
	context.subscriptions.push(disposable);
}

export function deactivate() {

}
