import * as vscode from 'vscode';
import * as path from 'path';

// Import custom libs
import * as tomlUtils from './../lib/TomlUtils';
import * as quartus from './../lib/QuartusUtils';
import * as pathUtils from './../lib/PathUtils';

import { currentTopLevelDisplay } from '../extension';

/**
 * @brief Command changes the current top level entity file of the active project.
 * @author BakxY
 */
export function getCommand(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.commands.registerCommand('vhdl-qqs.changeTopLevel', async () => {
        // Get currently active project
        const activeProject: string | null = await pathUtils.getCurrentQuartusProject(context);
        if (activeProject === null) { return; }

        // Get  quartus install bin path
        const quartusPath: string | null = await pathUtils.getQuartusBinPath();
        if (quartusPath === null) { return; }

        // Get toml file path set in vs code setting
        const pathToToml = pathUtils.getTomlLocalPath();
        if (pathToToml === null) { return; }

        // Get all entities listed in toml file
        const allEntities = tomlUtils.getAllEntities(pathUtils.getWorkspacePath()!, pathToToml);
        if (allEntities === null) { return; }

        // Remove file extensions
        for (let entity = 0; entity < allEntities.length; entity++) {
            allEntities[entity] = path.basename(allEntities[entity]).replace(path.extname(allEntities[entity]), '');
        }

        // Ask user to pick a entity
        const newTopLevel: string | undefined = await vscode.window.showQuickPick(allEntities, { title: 'Select new top level entity' });
        if (newTopLevel === undefined) { return; }

        // Update UI elements and update workspace storage
        quartus.setProjectTopLevel(context, activeProject, quartusPath, newTopLevel);
        currentTopLevelDisplay.text = 'Top Level: ' + newTopLevel;
        vscode.commands.executeCommand('vhdl-qqs.cleanCompileFiles');
    });
} 