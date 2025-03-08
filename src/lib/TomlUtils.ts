import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as toml from '@iarna/toml';
import * as pathUtils from './PathUtils';

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
export function getAllEntities(workspacePath: string, pathToToml: string) {
    pathToToml = path.join(workspacePath, pathToToml);

    console.log('Using toml file at "' + pathToToml + '"');

    if (!fs.existsSync(pathToToml)) {
        vscode.window.showErrorMessage('No file at "' + pathToToml + '"!');
        console.error('No file at "' + pathToToml + '"!');
        return null;
    }

    const tomlString: string = fs.readFileSync(pathToToml, 'utf8');

    if (!tomlString) {
        vscode.window.showErrorMessage('Unable to read toml file at "' + pathToToml + '"!');
        console.error('Unable to read toml file at "' + pathToToml + '"!');
        return null;
    }

    const parsedToml: TomlConfig = toml.parse(tomlString) as unknown as TomlConfig;

    let filesFromToml: string[] = [];

    for (let lib in parsedToml['libraries']) {
        filesFromToml = filesFromToml.concat(parsedToml['libraries'][lib]['files']);
    }

    let filteredFiles: string[] = [];

    console.log('Found ' + filesFromToml.length + ' number of raw paths');

    // Go trough all files in toml file
    for (let fileIndex = 0; fileIndex < filesFromToml.length; fileIndex++) {
        // Check for none wildcard paths
        if (!filesFromToml[fileIndex].includes('*')) {
            filteredFiles.push(path.normalize(filesFromToml[fileIndex]));
            continue;
        }

        // Resolve wildcard paths
        const resolvedPath = pathUtils.resolvePathWithWildcards(path.normalize(filesFromToml[fileIndex]));

        // Add all resolved paths to the file array
        for (let pathIndex = 0; pathIndex < resolvedPath.length; pathIndex++) {
            filteredFiles.push(resolvedPath[pathIndex]);
            console.log('Expanded wildcard path "' + filesFromToml[fileIndex] + '" to file "' + resolvedPath[pathIndex] + '"');
        }
    }

    return filteredFiles;
}