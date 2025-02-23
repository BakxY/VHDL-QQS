import * as vscode from 'vscode';
import * as fs from 'fs';
import * as toml from '@iarna/toml';

interface TomlConfig {
    libraries: {
        [key: string]: {
            files: string[];
        };
    };
}

export type entityProperty = {
    propertyName: string;
    propertyType: string;
    propertySignalDir: string;
    propertySubType: string;
}

const ENTITY_BLOCK_FORMAT: RegExp = /entity\s+(\w+)\s+is\s+([\s\S]*?)\s+end\s+\1\s*;/;

export function getSelectedExpression(editor: vscode.TextEditor | undefined) {
    const selection = editor?.selection;

    // Check if user has selected any text
    if (!selection || selection.isEmpty) {
        vscode.window.showErrorMessage('No expression selected!');
        return;
    }

    // Convert selection object and get selected text
    const selectionRange = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);

    return editor.document.getText(selectionRange);
}

export function getAllEntities(pathToToml: string) {
    const tomlString: string = fs.readFileSync(pathToToml, 'utf8');

    if (!tomlString) {
        vscode.window.showErrorMessage('Unable to read toml file at "' + pathToToml + '"!');
        return;
    }

    const parsedToml: TomlConfig = toml.parse(tomlString) as unknown as TomlConfig;

    return parsedToml['libraries']['lib']['files'];
}

export function getEntityContents(pathToEntityFile: string) {
    const entityFile: string = fs.readFileSync(pathToEntityFile, 'utf-8');

    if (!entityFile) {
        vscode.window.showErrorMessage('Unable to read entity file "' + pathToEntityFile + '"!');
        return;
    }

    const entityBlockRegexMatch: RegExpMatchArray | null = entityFile.match(ENTITY_BLOCK_FORMAT);

    if (!entityBlockRegexMatch) {
        vscode.window.showErrorMessage('Entity didn\'t match expected format in "' + pathToEntityFile + '"!');
        return;
    }

    return entityBlockRegexMatch![2];
}

export function getPropertiesFromContent(entityContent: string) {
    entityContent = entityContent.replace(/--.*$/gm, '').replaceAll('\n', '');
    let entityProperties: entityProperty[] = [];

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
        portContent += entityContent[index];
    }

    if (parenthesesCount != 0) {
        vscode.window.showErrorMessage('Entity port definition didn\'t match expected format!');
        return;
    }

    let genericContent: string = '';
    parenthesesCount = 0;

    if (entityContent.includes('generic')) {
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
            genericContent += entityContent[index];
        }

        if (parenthesesCount != 0) {
            vscode.window.showErrorMessage('Entity generic definition didn\'t match expected format!');
            return;
        }
    }
}