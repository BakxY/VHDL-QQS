import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import * as entityUtils from '../lib/EntityUtils';

import { outputChannel } from '../extension';

interface EntityQuickPickItem extends vscode.QuickPickItem {
    filePath: string;
    entityName: string;
}

/**
 * @brief Command used to copy an entity to a component and create an instance in the active architecture
 * @author VHDL-QQS
 */
export function getCommand(context: vscode.ExtensionContext): vscode.Disposable {
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

        const entities: EntityQuickPickItem[] = await findAllEntitiesInWorkspace();

        if (entities.length === 0) {
            vscode.window.showErrorMessage('No entities found in workspace!');
            console.error('No entities found in workspace!');
            outputChannel.appendLine('No entities found in workspace!');
            return;
        }

        const selectedEntity: EntityQuickPickItem | undefined = await vscode.window.showQuickPick(entities, {
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

        const componentDeclaration: string = generateComponentDeclaration(selectedEntity.entityName, genericProperties, portProperties);

        const instanceString: string = generateInstance(selectedEntity.entityName, instanceName, genericProperties, portProperties);

        const success: boolean = await insertComponentAndInstance(editor, componentDeclaration, instanceString, selectedEntity.entityName);

        if (success) {
            vscode.window.showInformationMessage(`Successfully created component and instance of "${selectedEntity.entityName}"`);
            outputChannel.appendLine(`Created component and instance of "${selectedEntity.entityName}"`);
        }
    });
}

/**
 * @brief Finds all entities in the workspace
 * 
 * @returns Array of EntityQuickPickItem with available entities
 */
async function findAllEntitiesInWorkspace(): Promise<EntityQuickPickItem[]> {
    const entities: EntityQuickPickItem[] = [];

    const vhdlFiles: vscode.Uri[] = await vscode.workspace.findFiles('**/*.vhd');

    for (const fileUri of vhdlFiles) {
        const filePath: string = fileUri.fsPath;
        const entityName: string | null = extractEntityName(filePath);

        if (entityName !== null) {
            entities.push({
                label: entityName,
                description: path.relative(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '', filePath),
                filePath: filePath,
                entityName: entityName
            });
        }
    }

    entities.sort((a, b) => a.entityName.localeCompare(b.entityName));

    return entities;
}

/**
 * @brief Extracts the entity name from a VHDL file
 * 
 * @param filePath Path to the VHDL file
 * @returns Entity name or null if not found
 */
function extractEntityName(filePath: string): string | null {
    try {
        const fileContent: string = fs.readFileSync(filePath, 'utf-8');
        const entityMatch: RegExpMatchArray | null = fileContent.match(/entity\s+(\w+)\s+is/i);

        if (!entityMatch) {
            return null;
        }

        return entityMatch[1];
    } catch (error) {
        return null;
    }
}

/**
 * @brief Generates component declaration
 * 
 * @param entityName Name of the entity
 * @param genericProperties Array of generic properties
 * @param portProperties Array of port properties
 * @returns Component declaration string
 */
function generateComponentDeclaration(
    entityName: string,
    genericProperties: entityUtils.entityProperty[] | null,
    portProperties: entityUtils.entityProperty[] | null
): string {
    let componentContent: string = `component ${entityName} is\n`;

    if (genericProperties && genericProperties.length > 0) {
        componentContent += '  generic (\n';

        for (let i = 0; i < genericProperties.length; i++) {
            componentContent += `    ${genericProperties[i].propertyName} : ${genericProperties[i].propertyType}`;
            if (i < genericProperties.length - 1) {
                componentContent += ';\n';
            } else {
                componentContent += ');\n';
            }
        }
    }

    componentContent += '  port (\n';

    for (let i = 0; i < portProperties!.length; i++) {
        componentContent += `    ${portProperties![i].propertyName} : ${portProperties![i].propertySignalDir} ${portProperties![i].propertyType}`;
        if (i < portProperties!.length - 1) {
            componentContent += ';\n';
        } else {
            componentContent += ');\n';
        }
    }

    componentContent += `end component ${entityName};\n`;

    return componentContent;
}

/**
 * @brief Generates instance instantiation
 * 
 * @param entityName Name of the entity
 * @param instanceName Name of the instance
 * @param genericProperties Array of generic properties
 * @param portProperties Array of port properties
 * @returns Instance instantiation string
 */
function generateInstance(
    entityName: string,
    instanceName: string,
    genericProperties: entityUtils.entityProperty[] | null,
    portProperties: entityUtils.entityProperty[] | null
): string {
    let instanceContent: string = `${instanceName} : ${entityName}\n`;

    if (genericProperties && genericProperties.length > 0) {
        instanceContent += '  generic map (\n';

        for (let i = 0; i < genericProperties.length; i++) {
            instanceContent += `    ${genericProperties[i].propertyName} => ${genericProperties[i].propertyName}`;
            if (i < genericProperties.length - 1) {
                instanceContent += ',\n';
            } else {
                instanceContent += ')\n';
            }
        }
    }

    instanceContent += '  port map (\n';

    for (let i = 0; i < portProperties!.length; i++) {
        instanceContent += `    ${portProperties![i].propertyName} => ${portProperties![i].propertyName}`;
        if (i < portProperties!.length - 1) {
            instanceContent += ',\n';
        } else {
            instanceContent += ');\n';
        }
    }

    return instanceContent;
}

/**
 * @brief Inserts component declaration and instance into active document
 * 
 * @param editor The active text editor
 * @param componentDeclaration Component declaration string
 * @param instanceString Instance instantiation string
 * @param componentName Name of the component
 * @returns true if successful, false otherwise
 */
async function insertComponentAndInstance(
    editor: vscode.TextEditor,
    componentDeclaration: string,
    instanceString: string,
    componentName: string
): Promise<boolean> {
    try {
        const document: vscode.TextDocument = editor.document;
        const documentText: string = document.getText();

        const archBeginMatch: RegExpMatchArray | null = documentText.match(/\bbegin\b/i);
        if (!archBeginMatch) {
            vscode.window.showErrorMessage('Could not find "begin" keyword in file!');
            console.error('Could not find "begin" keyword in file!');
            outputChannel.appendLine('Could not find "begin" keyword in file!');
            return false;
        }

        const beginPosition: number = documentText.indexOf('begin');
        const lineNumber: number = documentText.substring(0, beginPosition).split('\n').length - 1;
        const insertComponentLine: vscode.Position = new vscode.Position(lineNumber, 0);

        await editor.edit((editBuilder: vscode.TextEditorEdit) => {
            editBuilder.insert(insertComponentLine, componentDeclaration + '\n');
        });

        const textAfterComponent: string = editor.document.getText();
        const beginIndexAfter: number = textAfterComponent.indexOf('begin');

        if (beginIndexAfter !== -1) {
            const beginLineEnd: number = textAfterComponent.indexOf('\n', beginIndexAfter);
            const insertInstanceLine: vscode.Position = new vscode.Position(
                textAfterComponent.substring(0, beginLineEnd).split('\n').length,
                0
            );

            await editor.edit((editBuilder: vscode.TextEditorEdit) => {
                editBuilder.insert(insertInstanceLine, instanceString + '\n');
            });
        } else {
            vscode.window.showWarningMessage('Could not find "begin" keyword for instance insertion.');
            console.warn('Could not find "begin" keyword for instance insertion.');
            outputChannel.appendLine('Could not find "begin" keyword for instance insertion.');
        }

        return true;
    } catch (error) {
        vscode.window.showErrorMessage('Error inserting component: ' + String(error));
        console.error('Error inserting component: ' + error);
        outputChannel.appendLine('Error inserting component: ' + error);
        return false;
    }
}
