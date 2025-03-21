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
    return vscode.commands.registerCommand('vhdl-qqs.selectQuartusProject', async () => {
        const allProjectFiles: string[] = quartus.getAllProjectFiles();

        // Check if there are any quartus project file are in current workspace
        if (allProjectFiles.length === 0) {
            vscode.window.showErrorMessage('There are no project in your workfolder!');
            console.error('There are no project in your workfolder!');
            outputChannel.appendLine('There are no project in your workfolder!');
            return;
        }

        // Ask user to select a project
        const selectedProject: string | undefined = await vscode.window.showQuickPick(allProjectFiles, { title: 'Select a project' });
        if (selectedProject === undefined) { return; }

        // Update UI elements and update workspace storage
        context.workspaceState.update('vhdl-qqs.currentActiveQuartusProject', selectedProject);
        currentQuartusProjectDisplay.text = 'Quartus: ' + path.basename(selectedProject).replace(path.extname(selectedProject), '');

        // Get currently active project
        const activeProject: string | null = await pathUtils.getCurrentQuartusProject(context);
        if (activeProject === null) { return; }

        // Get  quartus install bin path
        const quartusPath: string | null = await pathUtils.getQuartusBinPath();
        if (quartusPath === null) { return; }

        quartusProjectFilesView.updateData(context, activeProject, quartusPath);
        quartusProjectPropertiesView.updateData(context, activeProject, quartusPath);

        const projectTopLevel: string = quartus.getProjectTopLevel(context, activeProject, quartusPath);
        currentTopLevelDisplay.text = 'Top Level: ' + projectTopLevel;
    });
} 