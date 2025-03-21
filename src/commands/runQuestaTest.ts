import * as vscode from 'vscode';

// Import custom libs
import * as testCommands from './../lib/TestCommands';
import * as pathUtils from './../lib/PathUtils';

import { outputChannel } from '../extension';

export function getCommand(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.commands.registerCommand('vhdl-qqs.runQuestaTest', async () => {
        if (!vscode.workspace.getConfiguration('vhdl-qqs').get('questaFeatureFlag')) {
            vscode.window.showErrorMessage('Feature isn\'t enabled!');
            console.error('Feature isn\'t enabled!');
            outputChannel.appendLine('Feature isn\'t enabled!');
            return;
        }

        // Get currently active project
        const activeProject: string | null = await pathUtils.getCurrentQuestaProject(context);
        if (activeProject === null) { return; }

        // Get  quartus install bin path
        const questaPath: string | null = await pathUtils.getQuestaBinPath();
        if (questaPath === null) { return; }

        testCommands.runQuestaTest(context, activeProject, questaPath);
    });
} 