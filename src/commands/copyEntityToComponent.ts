import * as vscode from 'vscode';
import * as path from 'path';

import * as entityUtils from '../lib/EntityUtils';

import { outputChannel } from '../extension';

/**
 * @brief Command used to copy an entity to a component and create an instance in the active architecture
 * @author dwildmann
 */
export function getCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('vhdl-qqs.copyEntityToComponent', async () => {
        const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;

        if (editor === undefined) {
            vscode.window.showErrorMessage('No open file!');
            console.error('No open file!');
            outputChannel.appendLine('No open file!');
            return;
        }

        const targetFilePath: string = path.normalize(editor.document.fileName);

        if (path.extname(targetFilePath) !== '.vhd') {
            vscode.window.showErrorMessage('Only VHDL files are supported!');
            console.error('Only VHDL files are supported!');
            outputChannel.appendLine('Only VHDL files are supported!');
            return;
        }

        const entities: entityUtils.EntityQuickPickItem[] = await entityUtils.findAllEntitiesInWorkspace();

        if (entities.length === 0) {
            vscode.window.showErrorMessage('No entities found in workspace!');
            console.error('No entities found in workspace!');
            outputChannel.appendLine('No entities found in workspace!');
            return;
        }

        const selectedEntity: entityUtils.EntityQuickPickItem | undefined = await vscode.window.showQuickPick(entities, {
            title: 'Select entity to create component from',
            placeHolder: 'Choose an entity...'
        });

        if (selectedEntity === undefined) {
            return;
        }

        const entityContent: string | null = entityUtils.getEntityContents(selectedEntity.filePath);
        if (entityContent === null) {
            return;
        }

        const genericContent: string | null = entityUtils.getGenericContent(entityContent);
        const portContent: string | null = entityUtils.getPortContent(entityContent);

        const genericProperties: entityUtils.entityProperty[] | null = entityUtils.getGenericPropertiesFromContent(genericContent);
        const portProperties: entityUtils.entityProperty[] | null = entityUtils.getPortPropertiesFromContent(portContent);

        if (portProperties === null || portProperties.length === 0) {
            vscode.window.showErrorMessage('Entity has no ports defined!');
            console.error('Entity has no ports defined!');
            outputChannel.appendLine('Entity has no ports defined!');
            return;
        }

        const instanceName: string | undefined = await vscode.window.showInputBox({
            title: 'Enter the instance name',
            value: selectedEntity.entityName + '_inst',
            validateInput: (value: string) => {
                if (value.length === 0) {
                    return 'Instance name cannot be empty!';
                }
                return '';
            }
        });

        if (instanceName === undefined) {
            return;
        }

        const componentDeclaration: string = entityUtils.generateComponentDeclaration(selectedEntity.entityName, genericProperties, portProperties);

        const instanceString: string = entityUtils.generateInstance(selectedEntity.entityName, instanceName, genericProperties, portProperties);

        const success: boolean = await entityUtils.insertComponentAndInstance(editor, componentDeclaration, instanceString, selectedEntity.entityName);

        if (success) {
            vscode.window.showInformationMessage(`Successfully created component and instance of "${selectedEntity.entityName}"`);
            outputChannel.appendLine(`Created component and instance of "${selectedEntity.entityName}"`);
        }
    });
}
