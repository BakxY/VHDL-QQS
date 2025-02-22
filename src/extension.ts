import * as vscode from 'vscode';
import { getSelectedExpression, getAllEntities, getEntityContents } from './lib/EntityUtils';

const TOML_PATH: string = './vhdl_ls.toml';

const ENTITY_GENERIC_REGEX: RegExp = /generic\s*\(([\s\S]*?)\)\s*;/;
const ENTITY_PORT_REGEX: RegExp = /port\s*\(([\s\S]*?)\)\s*;/;

export function activate(context: vscode.ExtensionContext) {
	var disposable = vscode.commands.registerCommand('extension.generateTestBench', () => {
		const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;

		// Check if editor is opened
		if (editor == undefined) {
			vscode.window.showErrorMessage('No editor opened!');
			return;
		}

		const selectedExpression: string | undefined = getSelectedExpression(editor);

		if (!selectedExpression) {
			// Error message is printed in function
			return;
		}

		const allEntities = getAllEntities(TOML_PATH);

		if (!allEntities) {
			// Error message is printed in function
			return;
		}

		let pathToEntityFile: string = '';

		for (let entity in allEntities) {
			if (allEntities[entity].endsWith(selectedExpression + '.vhd')) {
				pathToEntityFile = allEntities[entity].replaceAll('\\', '/');
				break;
			}
		}

		if (pathToEntityFile == '') {
			vscode.window.showErrorMessage('Selected expression is not defined as a entity in your project!');
			return;
		}

		const entityContent: string | undefined = getEntityContents(pathToEntityFile)?.replaceAll('\r', '');

		if (!entityContent) {
			// Error message is printed in function
			return;
		}
	});
	context.subscriptions.push(disposable);
}

export function deactivate() {

}
