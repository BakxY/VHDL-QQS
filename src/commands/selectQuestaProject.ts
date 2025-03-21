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
    return vscode.commands.registerCommand('vhdl-qqs.selectQuestaProject', async () => {
        if (!vscode.workspace.getConfiguration('vhdl-qqs').get('questaFeatureFlag')) {
            vscode.window.showErrorMessage('Feature isn\'t enabled!');
            console.error('Feature isn\'t enabled!');
            outputChannel.appendLine('Feature isn\'t enabled!');
            return;
        }

        const availableProjects: string[] = questa.getAllProjectFiles();

        // Check if there are any quartus project file are in current workspace
        if (availableProjects.length === 0) {
            vscode.window.showErrorMessage('There are no project in your workfolder!');
            console.error('There are no project in your workfolder!');
            outputChannel.appendLine('There are no project in your workfolder!');
            return;
        }

        // Ask user to select a project
        const selectedProject: string | undefined = await vscode.window.showQuickPick(availableProjects, { title: 'Select a project' });
        if (selectedProject === undefined) { return; }

        // Update UI elements and update workspace storage
        context.workspaceState.update('vhdl-qqs.currentActiveQuestaProject', selectedProject);
        currentQuestaProjectDisplay.text = 'Questa: ' + path.basename(selectedProject).replace(path.extname(selectedProject), '');
    });
} 