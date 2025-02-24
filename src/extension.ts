import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { entityProperty, getSelectedExpression, getAllEntities, getEntityContents, getPortContent, getGenericContent, getPortPropertiesFromContent, getGenericPropertiesFromContent } from './lib/EntityUtils';
import { generateTestbenchComponent } from './lib/TestbenchUtils';

const TOML_PATH: string = './vhdl_ls.toml';

export function activate(context: vscode.ExtensionContext) {
	var disposable = vscode.commands.registerCommand('extension.generateTestBench', () => {
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

		const genericContent: string | null = getGenericContent(entityContent);
		const portContent: string | null = getPortContent(entityContent);

		if (!portContent) {
			// Error message is printed in function
			return;
		}

		const PATH_TO_TESTBENCH_TEMPLATE: string = path.join(context.extensionPath, 'res', 'testbench_template.vhd');

		let generatedTestbench: string = fs.readFileSync(PATH_TO_TESTBENCH_TEMPLATE, 'utf-8');

		generatedTestbench = generatedTestbench.replaceAll('TESTBENCH_ENTITY', selectedExpression);
		generatedTestbench = generatedTestbench.replaceAll('DATE_CREATED', new Date().toLocaleDateString('de-CH'));

		const portProperties: entityProperty[] | null = getPortPropertiesFromContent(portContent);
		const genericProperties: entityProperty[] | null = getGenericPropertiesFromContent(genericContent);

		let componentContent = generateTestbenchComponent(genericProperties, portProperties);
		generatedTestbench = generatedTestbench.replaceAll('ENTITY_CONTENT', componentContent);
	});
	context.subscriptions.push(disposable);
}

export function deactivate() {

}
