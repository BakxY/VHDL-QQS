import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path'
import * as toml from '@iarna/toml';
import { resolvePathWithWildcards } from './PathUtils';

interface TomlConfig {
    libraries: {
        [key: string]: {
            files: string[];
        };
    };
}

export function getAllEntities(workspacePath: string, pathToToml: string) {
    pathToToml = path.join(workspacePath, pathToToml);
    
    console.log('Using toml file at "' + pathToToml + '"');

    if(!fs.existsSync(pathToToml))
    {
        vscode.window.showErrorMessage('No file at "' + pathToToml + '"!');
        console.error('No file at "' + pathToToml + '"!')
        return null;
    }

    const tomlString: string = fs.readFileSync(pathToToml, 'utf8');

    if (!tomlString) {
        vscode.window.showErrorMessage('Unable to read toml file at "' + pathToToml + '"!');
        console.error('Unable to read toml file at "' + pathToToml + '"!')
        return null;
    }

    const parsedToml: TomlConfig = toml.parse(tomlString) as unknown as TomlConfig;

    const filesFromToml = parsedToml['libraries']['lib']['files'];
    let filteredFiles: string[] = [];

    console.log('Found ' + filesFromToml.length + ' number of raw paths');

    for (let fileIndex = 0; fileIndex < filesFromToml.length; fileIndex++) {
        if (!filesFromToml[fileIndex].includes('*')) {
            filteredFiles.push(path.normalize(filesFromToml[fileIndex]));
            continue;
        }

        const resolvedPath = resolvePathWithWildcards(path.normalize(filesFromToml[fileIndex]));

        for (let pathIndex = 0; pathIndex < resolvedPath.length; pathIndex++) {
            filteredFiles.push(resolvedPath[pathIndex]);
            console.log('Expanded wildcard path "' + filesFromToml[fileIndex] + '" to file "' + resolvedPath[pathIndex] + '"');
        }
    }

    return filteredFiles;
}