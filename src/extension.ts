import * as vscode from 'vscode';
import { getSelectedExpression } from './lib/EntityUtils';
import { createNewTestbench } from './commands';
import { getAllEntities } from './lib/TomlUtils'

const TOML_PATH: string = './vhdl_ls.toml';

export function activate(context: vscode.ExtensionContext) {
	var disposable = vscode.commands.registerCommand('extension.generateTestBenchSelection', () => {
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

	var disposable = vscode.commands.registerCommand('extension.generateTestBenchExplorer', async () => {
		const allEntities = getAllEntities(TOML_PATH);

		if (!allEntities) {
			// Error message is printed in function
			return;
		}

		for(let entity = 0; entity < allEntities.length; entity++)
		{
			if(allEntities[entity].endsWith('_tp.vhd'))
			{
				delete allEntities[entity];
				continue;
			}
			allEntities[entity] = allEntities[entity].replace('.vhd', '');
		}

		const pick = await vscode.window.showQuickPick(allEntities);

		//createNewTestbench(context, selectedEntity);
	});
	context.subscriptions.push(disposable);
}

export function deactivate() {

}
