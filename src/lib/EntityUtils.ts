import * as vscode from 'vscode';
import * as fs from 'fs';
import { outputChannel } from '../extension';

export type entityProperty = {
    propertyName: string;
    propertyType: string;
    propertySignalDir: string | undefined;
}

const ENTITY_BLOCK_FORMAT: RegExp = /entity\s+(\w+)\s+is\s+([\s\S]*?)\s+end\s+(\1\s*|entity);/;
const MATCH_PROPERTY_DIR: RegExp = /\s+(in|out|inout)\s+/;

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
        outputChannel.append('No expression selected!');
        return null;
    }

    // Convert selection object and get selected text
    const selectionRange = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);

    // Get text selected by user
    const selectedText: string = editor.document.getText(selectionRange);
    
    console.log('Found user selected text: "' + selectedText + '"');
    outputChannel.append('Found user selected text: "' + selectedText + '"');
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

    // Check if file could be read
    if (!entityFile) {
        vscode.window.showErrorMessage('Unable to read entity file "' + pathToEntityFile + '"!');
        console.error('Unable to read entity file "' + pathToEntityFile + '"!');
        outputChannel.append('Unable to read entity file "' + pathToEntityFile + '"!');
        return null;
    }

    // Match entire content for a entity block
    const entityBlockRegexMatch: RegExpMatchArray | null = entityFile.match(ENTITY_BLOCK_FORMAT);

    // Check is regex succeeded
    if (!entityBlockRegexMatch) {
        vscode.window.showErrorMessage('Entity didn\'t match expected format in "' + pathToEntityFile + '"!');
        console.error('Entity didn\'t match expected format in "' + pathToEntityFile + '"!');
        outputChannel.append('Entity didn\'t match expected format in "' + pathToEntityFile + '"!');
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
    // Remove comments from content
    entityContent = entityContent.replace(/--.*$/gm, '').replaceAll('\n', '');

    // Check if any generic properties exist
    if(!entityContent.includes('generic')) { return null;}

    let genericContent: string = '';
    let parenthesesCount = 0;

    // Separate generic part of entity definition from definition
    for (let index = entityContent.indexOf('generic'); index < entityContent.length; index++) {
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
 */
export function getPortContent(entityContent: string) {
    // Remove comments from content
    entityContent = entityContent.replace(/--.*$/gm, '').replaceAll('\n', '');

    let portContent: string = '';
    let parenthesesCount: number = 0;

    // Separate port part of entity definition from definition
    for (let index = entityContent.indexOf('port'); index < entityContent.length; index++) {
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
 */
export function getPortPropertiesFromContent(entityContent: string | null) {
    let entityProperties: entityProperty[] = [];

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
            outputChannel.append('Entity port definition didn\'t match expected format!');
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
 */
export function getGenericPropertiesFromContent(entityContent: string | null) {
    // Check if there is no generic content
    if(entityContent === null) { return null; }
    
    let entityProperties: entityProperty[] = [];

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