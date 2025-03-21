import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as cp from 'child_process';

// Import custom libs
import * as entityUtils from './../lib/EntityUtils';
import * as testbenchCommands from './../lib/TestbenchCommand';
import * as tomlUtils from './../lib/TomlUtils';
import * as quartus from './../lib/QuartusUtils';
import * as questa from './../lib/QuestaUtils';
import * as compileCommands from './../lib/CompileCommand';
import * as testCommands from './../lib/TestCommands';
import * as statusBarCreator from './../lib/StatusBarUtils';
import * as pathUtils from './../lib/PathUtils';
import * as vhdlLang from './../lib/VhdlLang';

import { outputChannel, quartusProjectFilesView, quartusProjectPropertiesView, currentQuestaProjectDisplay, runQuestaTestsButton, currentQuartusProjectDisplay, currentTopLevelDisplay } from '../extension';

export function getCommand(context: vscode.ExtensionContext) {
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