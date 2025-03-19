import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as toml from '@iarna/toml';
import * as pathUtils from './PathUtils';
import { outputChannel } from '../extension';

interface TomlConfig {
    libraries: {
        [key: string]: {
            files: string[];
        };
    };
}

/**
 * @brief Reads the toml file and gets all .vhd files
 * 
 * @param workspacePath Base path for where to search paths given in toml file
 * 
 * @returns An array of all files listed in toml file
 */
export function getAllEntities(workspacePath: string, pathToToml: string): string[] | null {
    pathToToml = path.join(workspacePath, pathToToml);

    console.log('Using toml file at "' + pathToToml + '"');
    outputChannel.append('Using toml file at "' + pathToToml + '"');

    if (!fs.existsSync(pathToToml)) {
        vscode.window.showErrorMessage('No file at "' + pathToToml + '"!');
        console.error('No file at "' + pathToToml + '"!');
        outputChannel.append('No file at "' + pathToToml + '"!');
        return null;
    }

    const tomlString: string = fs.readFileSync(pathToToml, 'utf8');

    if (!tomlString) {
        vscode.window.showErrorMessage('Unable to read toml file at "' + pathToToml + '"!');
        console.error('Unable to read toml file at "' + pathToToml + '"!');
        outputChannel.append('Unable to read toml file at "' + pathToToml + '"!');
        return null;
    }

    const parsedToml: TomlConfig = toml.parse(tomlString) as unknown as TomlConfig;

    let filesFromToml: string[] = [];

    for (const lib in parsedToml['libraries']) {
        filesFromToml = filesFromToml.concat(parsedToml['libraries'][lib]['files']);
    }

    const filteredFiles: string[] = [];

    console.log('Found ' + filesFromToml.length + ' number of raw paths');
    outputChannel.append('Found ' + filesFromToml.length + ' number of raw paths');

    // Go trough all files in toml file
    for (let fileIndex = 0; fileIndex < filesFromToml.length; fileIndex++) {
        // Resolve wildcard paths
        const resolvedPath = pathUtils.resolvePathWithWildcards(path.normalize(filesFromToml[fileIndex]));

        // Add all resolved paths to the file array
        for (let pathIndex = 0; pathIndex < resolvedPath.length; pathIndex++) {
            filteredFiles.push(resolvedPath[pathIndex]);
            console.log('Expanded path "' + filesFromToml[fileIndex] + '" to file "' + resolvedPath[pathIndex] + '"');
            outputChannel.append('Expanded path "' + filesFromToml[fileIndex] + '" to file "' + resolvedPath[pathIndex] + '"');
        }
    }

    const noDuplicatesFiles: string[] = [...(new Set(filteredFiles))];

    return noDuplicatesFiles;
}