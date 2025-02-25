import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path'
import * as toml from '@iarna/toml';

interface TomlConfig {
    libraries: {
        [key: string]: {
            files: string[];
        };
    };
}

function resolvePathWithWildcards(pattern: string, baseDir: string = process.cwd()): string[] {
    const parts = pattern.split(path.sep);
    const results: string[] = [];

    function recursiveResolve(dir: string, remainingParts: string[]): void {
        if (remainingParts.length === 0) {
            if (fs.existsSync(dir)) {
                results.push(path.normalize(dir));
            }
            return;
        }

        const currentPart = remainingParts[0];
        const restParts = remainingParts.slice(1);

        if (currentPart === '**') {
            if (remainingParts.length === 1 && remainingParts[0] === '**') {
                recursiveResolve(dir, []);
            }
            recursiveResolve(dir, restParts);
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    recursiveResolve(path.join(dir, entry.name), remainingParts);
                }
            }
        } else if (currentPart === '*') {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.name.match(new RegExp(`^${currentPart.replace(/\*/g, '.*')}$`))) {
                    recursiveResolve(path.join(dir, entry.name), restParts);
                }
            }
        } else if (currentPart.includes('*')) { //Handle patterns like *.vhd
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            const regex = new RegExp(`^${currentPart.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`); //escape . for regex
            for (const entry of entries) {
                if (entry.name.match(regex)) {
                    recursiveResolve(path.join(dir, entry.name), restParts);
                }
            }
        } else {
            const nextDir = path.join(dir, currentPart);
            if (fs.existsSync(nextDir)) {
                recursiveResolve(nextDir, restParts);
            }
        }
    }

    recursiveResolve(baseDir, parts);
    return results;
}

export function getAllEntities(pathToToml: string) {
    const tomlString: string = fs.readFileSync(pathToToml, 'utf8');

    if (!tomlString) {
        vscode.window.showErrorMessage('Unable to read toml file at "' + pathToToml + '"!');
        return null;
    }

    const parsedToml: TomlConfig = toml.parse(tomlString) as unknown as TomlConfig;

    const filesFromToml = parsedToml['libraries']['lib']['files'];
    let filteredFiles: string[] = [];

    for (let fileIndex = 0; fileIndex < filesFromToml.length; fileIndex++) {
        if (!filesFromToml[fileIndex].includes('*')) {
            filteredFiles.push(path.normalize(filesFromToml[fileIndex]));
            continue;
        }

        const resolvedPath = resolvePathWithWildcards(path.normalize(filesFromToml[fileIndex]));

        for (let pathIndex = 0; pathIndex < resolvedPath.length; pathIndex++) {
            filteredFiles.push(resolvedPath[pathIndex]);
        }
    }

    return filteredFiles;
}