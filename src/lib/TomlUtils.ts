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

export function getAllEntities(pathToToml: string) {
    const tomlString: string = fs.readFileSync(pathToToml, 'utf8');

    if (!tomlString) {
        vscode.window.showErrorMessage('Unable to read toml file at "' + pathToToml + '"!');
        return null;
    }

    const parsedToml: TomlConfig = toml.parse(tomlString) as unknown as TomlConfig;

    return parsedToml['libraries']['lib']['files'];
}