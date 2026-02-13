import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { outputChannel } from '../extension';

export type entityProperty = {
    propertyName: string;
    propertyType: string;
    propertySignalDir: string | undefined;
}

/**
 * @brief Extends vscode quick items to store both entity name and file path.
 * 
 * @author dwildmann
 */
export interface EntityQuickPickItem extends vscode.QuickPickItem {
    filePath: string;
    entityName: string;
}

const ENTITY_BLOCK_FORMAT: RegExp = /entity\s+(\w+)\s+is\s+([\s\S]*?)\s+end(?:\s+entity)?(?:\s+\1)?\s*;/i;
const MATCH_PROPERTY_DIR: RegExp = /\s+(in|out|inout)\s+/i;

/**
 * @brief Gets the expression the user has currently selected
 * 
 * @param editor Currently opened vs code editor
 * 
 * @returns The selected expression as a string
 * 
 * @author BakxY
 */
export function getSelectedExpression(editor: vscode.TextEditor | undefined): string | null {
    const selection = editor?.selection;

    // Check if user has selected any text
    if (!selection || selection.isEmpty) {
        vscode.window.showErrorMessage('No expression selected!');
        console.error('No expression selected!');
        outputChannel.appendLine('No expression selected!');
        return null;
    }

    // Convert selection object and get selected text
    const selectionRange = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);

    // Get text selected by user
    const selectedText: string = editor.document.getText(selectionRange);
    
    console.log('Found user selected text: "' + selectedText + '"');
    outputChannel.appendLine('Found user selected text: "' + selectedText + '"');
    return selectedText;
}

/**
 * @brief Gets the entity content from the path to a entities .vhd file
 * 
 * @param pathToEntityFile Path to the entity that the contents should extracted from
 * 
 * @returns The content of the entities declaration as a string
 * 
 * @author BakxY
 */
export function getEntityContents(pathToEntityFile: string): string | null {
    const entityFile: string = fs.readFileSync(pathToEntityFile, 'utf-8');

    // Check if file could be read
    if (!entityFile) {
        vscode.window.showErrorMessage('Unable to read entity file "' + pathToEntityFile + '"!');
        console.error('Unable to read entity file "' + pathToEntityFile + '"!');
        outputChannel.appendLine('Unable to read entity file "' + pathToEntityFile + '"!');
        return null;
    }

    // Match entire content for a entity block
    const entityBlockRegexMatch: RegExpMatchArray | null = entityFile.match(ENTITY_BLOCK_FORMAT);

    // Check is regex succeeded
    if (!entityBlockRegexMatch) {
        vscode.window.showErrorMessage('Entity didn\'t match expected format in "' + pathToEntityFile + '"!');
        console.error('Entity didn\'t match expected format in "' + pathToEntityFile + '"!');
        outputChannel.appendLine('Entity didn\'t match expected format in "' + pathToEntityFile + '"!');
        return null;
    }

    return entityBlockRegexMatch![2];
}

/**
 * @brief Separates the generic part of a entity declaration from the rest
 * 
 * @param entityContent The entire entity declaration
 * 
 * @returns The separated generic content as a string
 * 
 * @author BakxY
 */
export function getGenericContent(entityContent: string): string | null {
    // Remove comments from content
    entityContent = entityContent.replace(/--.*$/gm, '').replaceAll('\n', '');

    // Check if any generic properties exist
    if(!entityContent.toLowerCase().includes('generic')) { return null;}

    let genericContent: string = '';
    let parenthesesCount = 0;

    // Separate generic part of entity definition from definition
    for (let index = entityContent.toLowerCase().indexOf('generic'); index < entityContent.length; index++) {
        if (entityContent[index] === '(') {
            parenthesesCount++;
        }

        if (entityContent[index] === ')') {
            parenthesesCount--;
        }

        if (entityContent[index] === ';' && parenthesesCount === 0) {
            break;
        }

        if (parenthesesCount > 0) {
            genericContent += entityContent[index];
        }
    }

    // Remove leading parenthesis
    genericContent = genericContent.replace('(', '').trim();

    // Check if any parenthesis blocks were matched
    if (parenthesesCount !== 0) {
        vscode.window.showErrorMessage('Entity generic definition didn\'t match expected format!');
        return null;
    }

    return genericContent;
}

/**
 * @brief Separates the port part of a entity declaration from the rest
 * 
 * @param entityContent The entire entity declaration
 * 
 * @returns The separated port content as a string
 * 
 * @author BakxY
 */
export function getPortContent(entityContent: string): string | null {
    // Remove comments from content
    entityContent = entityContent.replace(/--.*$/gm, '').replaceAll('\n', '');

    let portContent: string = '';
    let parenthesesCount: number = 0;

    // Separate port part of entity definition from definition
    for (let index = entityContent.toLowerCase().indexOf('port'); index < entityContent.length; index++) {
        if (entityContent[index] === '(') {
            parenthesesCount++;
        }

        if (entityContent[index] === ')') {
            parenthesesCount--;
        }

        if (entityContent[index] === ';' && parenthesesCount === 0) {
            break;
        }

        if (parenthesesCount > 0) {
            portContent += entityContent[index];
        }
    }

    // Remove leading parenthesis
    portContent = portContent.replace('(', '').trim();

    // Check if any parenthesis blocks were matched
    if (parenthesesCount !== 0) {
        vscode.window.showErrorMessage('Entity port definition didn\'t match expected format!');
        return null;
    }

    return portContent;
}

/**
 * @brief Converts the port content to a array of port properties
 * 
 * @param entityContent The port content as a string
 * 
 * @returns An array of all entity port properties
 * 
 * @author BakxY
 */
export function getPortPropertiesFromContent(entityContent: string | null): entityProperty[] | null {
    const entityProperties: entityProperty[] = [];

    // Split content with using separator
    const splitContent: string[] = entityContent!.split(';');

    // Go trough all properties
    for (let propertyIndex = 0; propertyIndex < splitContent.length; propertyIndex++) {
        const currentPropertySplit: string[] = splitContent[propertyIndex].split(':');

        // Split name of property with separator to allow for property declarations on one line
        const currentPropertyNamesSplit: string[] = currentPropertySplit[0].split(',');

        // Match part of property for port direction
        const currentPropertyDir: RegExpMatchArray | null = currentPropertySplit[1].match(MATCH_PROPERTY_DIR);

        // Check if regex succeeded
        if (currentPropertyDir === null) {
            vscode.window.showErrorMessage('Entity port definition didn\'t match expected format!');
            console.error('Entity port definition didn\'t match expected format!');
            outputChannel.appendLine('Entity port definition didn\'t match expected format!');
            return null;
        }

        // Separate property type from rest
        const currentPropertyType = currentPropertySplit[1].replace(currentPropertyDir[0], '');

        // Go trough all properties defines on this line
        for (let nameIndex = 0; nameIndex < currentPropertyNamesSplit.length; nameIndex++) {
            entityProperties.push({
                propertyName: currentPropertyNamesSplit[nameIndex].trim(),
                propertySignalDir: currentPropertyDir[0].trim(),
                propertyType: currentPropertyType.trim()
            });
        }
    }

    return entityProperties;
}

/**
 * @brief Converts the generic content to a array of generic properties
 * 
 * @param entityContent The generic content as a string
 * 
 * @returns An array of all entity generic properties
 * 
 * @author BakxY
 */
export function getGenericPropertiesFromContent(entityContent: string | null): entityProperty[] | null {
    // Check if there is no generic content
    if(entityContent === null) { return null; }
    
    const entityProperties: entityProperty[] = [];

    // Split content with using separator
    const splitContent: string[] = entityContent!.split(';');

    // Go trough all generic definitions
    for (let propertyIndex = 0; propertyIndex < splitContent.length; propertyIndex++) {
        const currentPropertySplit: string[] = splitContent[propertyIndex].split(':');

        entityProperties.push({
            propertyName: currentPropertySplit[0].trim(),
            propertySignalDir: undefined,
            propertyType: currentPropertySplit[1].trim()
        });
    }

    return entityProperties;
}

/**
 * @brief Finds all entities in the workspace
 * 
 * @returns Array of EntityQuickPickItem with available entities
 * 
 * @author dwildmann
 */
export async function findAllEntitiesInWorkspace(): Promise<EntityQuickPickItem[]> {
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
 * 
 * @returns Entity name or null if not found
 * 
 * @author dwildmann
 */
export function extractEntityName(filePath: string): string | null {
    //* Removed try catch statement and added length check to regex result
    const fileContent: string = fs.readFileSync(filePath, 'utf-8');
    const entityMatch: RegExpMatchArray | null = fileContent.match(/entity\s+(\w+)\s+is/i);

    if (!entityMatch || entityMatch.length < 2) {
        return null;
    }

    return entityMatch[1];
}

/**
 * @brief Generates component declaration
 * 
 * @param entityName Name of the entity
 * @param genericProperties Array of generic properties
 * @param portProperties Array of port properties
 * 
 * @returns Component declaration string
 * 
 * @author dwildmann
 */
export function generateComponentDeclaration(
    entityName: string,
    genericProperties: entityProperty[] | null,
    portProperties: entityProperty[] | null
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
 * 
 * @returns Instance instantiation string
 * 
 * @author dwildmann
 */
export function generateInstance(
    entityName: string,
    instanceName: string,
    genericProperties: entityProperty[] | null,
    portProperties: entityProperty[] | null
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
 * 
 * @returns true if successful, false otherwise
 * 
 * @author dwildmann
 */
export async function insertComponentAndInstance(
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

        // Check if component is already declared
        const componentRegex: RegExp = new RegExp(`component\\s+${componentName}\\s+is`, 'i');
        const componentExists: boolean = componentRegex.test(documentText);

        if (!componentExists) {
            const beginPosition: number = documentText.indexOf('begin');
            const lineNumber: number = documentText.substring(0, beginPosition).split('\n').length - 1;
            const insertComponentLine: vscode.Position = new vscode.Position(lineNumber, 0);

            await editor.edit((editBuilder: vscode.TextEditorEdit) => {
                editBuilder.insert(insertComponentLine, componentDeclaration + '\n');
            });
        }

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
