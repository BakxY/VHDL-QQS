import * as vscode from 'vscode';
import * as fs from 'fs';
import * as toml from '@iarna/toml';

interface TomlConfig {
    libraries: {
        [key: string]: {
            files: string[];
        };
    };
    // ... other top-level properties
}

const ENTITY_BLOCK_FORMAT = /entity\s+(\w+)\s+is\s+([\s\S]*?)\s+end\s+\1\s*;/;

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

    const entityBlockRegexMatch = entityFile.match(ENTITY_BLOCK_FORMAT);

    if (!entityBlockRegexMatch) {
        vscode.window.showErrorMessage('Entity didn\'t match expected format in "' + pathToEntityFile + '"!');
        return;
    }

    return entityBlockRegexMatch![2];
}