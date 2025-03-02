import * as vscode from 'vscode';
import * as fs from 'fs';

export type entityProperty = {
    propertyName: string;
    propertyType: string;
    propertySignalDir: string | undefined;
}

const ENTITY_BLOCK_FORMAT: RegExp = /entity\s+(\w+)\s+is\s+([\s\S]*?)\s+end\s+\1\s*;/;
const MATCH_PROPERTY_DIR: RegExp = /\s+(in|out)\s+/;

/**
 * @brief Gets the expression the user has currently selected
 * 
 * @param editor Currently opened vs code editor
 * 
 * @returns The selected expression as a string
 */
export function getSelectedExpression(editor: vscode.TextEditor | undefined) {
    const selection = editor?.selection;

    // Check if user has selected any text
    if (!selection || selection.isEmpty) {
        vscode.window.showErrorMessage('No expression selected!');
        console.error('No expression selected!');
        return null;
    }

    // Convert selection object and get selected text
    const selectionRange = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);

    const selectedText: string = editor.document.getText(selectionRange);
    
    console.log('Found user selected text: "' + selectedText + '"');

    return selectedText;
}

/**
 * @brief Gets the entity content from the path to a entities .vhd file
 * 
 * @param pathToEntityFile Path to the entity that the contents should extracted from
 * 
 * @returns The content of the entities declaration as a string
 */
export function getEntityContents(pathToEntityFile: string) {
    const entityFile: string = fs.readFileSync(pathToEntityFile, 'utf-8');

    if (!entityFile) {
        vscode.window.showErrorMessage('Unable to read entity file "' + pathToEntityFile + '"!');
        console.error('Unable to read entity file "' + pathToEntityFile + '"!');
        return null;
    }

    const entityBlockRegexMatch: RegExpMatchArray | null = entityFile.match(ENTITY_BLOCK_FORMAT);

    if (!entityBlockRegexMatch) {
        vscode.window.showErrorMessage('Entity didn\'t match expected format in "' + pathToEntityFile + '"!');
        console.error('Entity didn\'t match expected format in "' + pathToEntityFile + '"!');
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
 */
export function getGenericContent(entityContent: string) {
    entityContent = entityContent.replace(/--.*$/gm, '').replaceAll('\n', '');

    if(!entityContent.includes('generic'))
    {
        return null;
    }

    let genericContent: string = '';
    let parenthesesCount = 0;

    for (let index = entityContent.indexOf('generic'); index < entityContent.length; index++) {
        if (entityContent[index] == '(') {
            parenthesesCount++;
        }

        if (entityContent[index] == ')') {
            parenthesesCount--;
        }

        if (entityContent[index] == ';' && parenthesesCount == 0) {
            break;
        }

        if (parenthesesCount > 0) {
            genericContent += entityContent[index];
        }
    }

    genericContent = genericContent.replace('(', '').trim();

    if (parenthesesCount != 0) {
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
 */
export function getPortContent(entityContent: string) {
    entityContent = entityContent.replace(/--.*$/gm, '').replaceAll('\n', '');

    let portContent: string = '';
    let parenthesesCount: number = 0;

    for (let index = entityContent.indexOf('port'); index < entityContent.length; index++) {
        if (entityContent[index] == '(') {
            parenthesesCount++;
        }

        if (entityContent[index] == ')') {
            parenthesesCount--;
        }

        if (entityContent[index] == ';' && parenthesesCount == 0) {
            break;
        }

        if (parenthesesCount > 0) {
            portContent += entityContent[index];
        }
    }

    portContent = portContent.replace('(', '').trim();

    if (parenthesesCount != 0) {
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
 */
export function getPortPropertiesFromContent(entityContent: string | null) {
    let entityProperties: entityProperty[] = [];

    const splitContent: string[] = entityContent!.split(';');

    for (let propertyIndex = 0; propertyIndex < splitContent.length; propertyIndex++) {
        const currentPropertySplit: string[] = splitContent[propertyIndex].split(':');

        const currentPropertyNamesSplit: string[] = currentPropertySplit[0].split(',');

        const currentPropertyDir = currentPropertySplit[1].match(MATCH_PROPERTY_DIR);

        if (!currentPropertyDir) {
            vscode.window.showErrorMessage('Entity port definition didn\'t match expected format!');
            console.error('Entity port definition didn\'t match expected format!');
            return null;
        }

        const currentPropertyType = currentPropertySplit[1].replace(currentPropertyDir[0], '');

        for (let nameIndex = 0; nameIndex < currentPropertyNamesSplit.length; nameIndex++) {
            entityProperties.push({
                propertyName: currentPropertyNamesSplit[nameIndex].trim(),
                propertySignalDir: currentPropertyDir[0].trim(),
                propertyType: currentPropertyType.trim()
            })
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
 */
export function getGenericPropertiesFromContent(entityContent: string | null) {
    if(!entityContent)
    {
        return null;
    }
    
    let entityProperties: entityProperty[] = [];

    const splitContent: string[] = entityContent!.split(';');

    for (let propertyIndex = 0; propertyIndex < splitContent.length; propertyIndex++) {
        const currentPropertySplit: string[] = splitContent[propertyIndex].split(':');

        entityProperties.push({
            propertyName: currentPropertySplit[0].trim(),
            propertySignalDir: undefined,
            propertyType: currentPropertySplit[1].trim()
        })
    }

    return entityProperties;
}