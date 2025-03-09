import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as quartus from './QuartusUtils';
import * as questa from './QuestaUtils';

/**
 * @brief Resolves a path with wildcard syntax to an array of all possible paths
 * 
 * @param wildcardPath The raw path including the wildcard syntax
 * @param baseDir The path to from where the path should be explored
 * 
 * @returns An array of all possible paths included by the provided path
 */
export function resolvePathWithWildcards(wildcardPath: string, baseDir: string = getWorkspacePath()!): string[] {
    const parts = wildcardPath.split(path.sep);
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

/**
 * @brief Gets the currently selected quartus project from the workspace storage
 * 
 * @param context Context from where the command was ran
 * 
 * @returns The workstation path to the current project
 */
export function getCurrentQuartusProject(context: vscode.ExtensionContext): string | null {
    const activeProject = context.workspaceState.get('vhdl-qqs.currentActiveQuartusProject', undefined);

    // Check if no project is set in current workspace
    if (activeProject === undefined) {
        vscode.window.showErrorMessage('No quartus project selected!');
        console.error('No quartus project selected!');
        return null;
    }

    return activeProject;
}

/**
 * @brief Gets the currently selected questa project from the workspace storage
 * 
 * @param context Context from where the command was ran
 * 
 * @returns The workstation path to the current project
 */
export function getCurrentQuestaProject(context: vscode.ExtensionContext): string | null {
    const activeProject = context.workspaceState.get('vhdl-qqs.currentActiveQuestaProject', undefined);

    // Check if no project is set in current workspace
    if (activeProject === undefined) {
        vscode.window.showErrorMessage('No questa project selected!');
        console.error('No questa project selected!');
        return null;
    }

    return activeProject;
}

/**
 * @brief Gets the path to the current workspace
 * 
 * @returns The current workstation path
 */
export function getWorkspacePath(): string | null {
    return vscode.workspace.workspaceFolders![0].uri.fsPath;
}

/**
 * @brief Gets the quartus binary path from the vs code settings and checks for an installation
 * 
 * @returns The path to a valid quartus installation
 */
export function getQuartusBinPath(): string | null {
    const quartusPath = vscode.workspace.getConfiguration('vhdl-qqs').get<string>('quartusBinPath');

    // Check if no quartus path has been set
    if (quartusPath === undefined) {
        vscode.window.showErrorMessage('No quartus installation folder defined in settings!');
        console.error('No quartus installation folder defined in settings!');
        return null;
    }

    // Check if path is a valid quartus install path
    if (!quartus.checkForQuartusInstallation(path.normalize(quartusPath))) {
        vscode.window.showErrorMessage('No quartus installation at provided path! Check your settings!');
        console.error('No quartus installation at provided path! Check your settings!');
        return null;
    }

    return path.normalize(quartusPath);
}

/**
 * @brief Gets the questa binary path from the vs code settings and checks for an installation
 * 
 * @returns The path to a valid questa installation
 */
export function getQuestaBinPath(): string | null {
    const questaPath = vscode.workspace.getConfiguration('vhdl-qqs').get<string>('questaBinPath');

    // Check if no questa path has been set
    if (questaPath === undefined) {
        vscode.window.showErrorMessage('No questa installation folder defined in settings!');
        console.error('No questa installation folder defined in settings!');
        return null;
    }

    // Check if path is a valid quartus install path
    if (!questa.checkForQuestaInstallation(path.normalize(questaPath))) {
        vscode.window.showErrorMessage('No questa installation at provided path! Check your settings!');
        console.error('No questa installation at provided path! Check your settings!');
        return null;
    }

    return path.normalize(questaPath);
}

/**
 * @brief Gets the toml path from the settings file
 * 
 * @returns The path to the project toml file as a string
 */
export function getTomlLocalPath(): string | null {
    const pathToToml = vscode.workspace.getConfiguration('vhdl-qqs').get<string>('tomlPath');

    // Check if no toml path has been set
    if (pathToToml === undefined) {
        vscode.window.showErrorMessage('No path for toml file set! Please change in settings!');
        console.error('No path for toml file set! Please change in settings!');
        return null;
    }

    return pathToToml;
}

/**
 * @brief Resolve a array of relative paths read from the quartus project file (passed none relative paths trough)
 * 
 * @param basePath The path to from where to start resolving relative paths
 * @param pathsToResolve The array of strings to resolve
 * 
 * @returns The resolved array of paths
 */
export function resolveRelativePathArray(basePath: string, pathsToResolve: string[]): string[] {
    let resolvedPaths: string[] = [];

    // Runs trough all given paths
    for (let fileIndex = 0; fileIndex < pathsToResolve.length; fileIndex++) {
        // Check if path has to be resolved
        if(path.isAbsolute(pathsToResolve[fileIndex]))
        {
            resolvedPaths.push(pathsToResolve[fileIndex]);
            continue;
        }

        resolvedPaths.push(path.resolve(basePath, pathsToResolve[fileIndex]));
    }

    return resolvedPaths;
}