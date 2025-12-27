import * as vscode from 'vscode';

// Import custom libs
import * as pathUtils from '../lib/PathUtils';
import * as questa from '../lib/QuestaUtils';

import { outputChannel } from '../extension';

/**
 * @brief Command used to select questa test script to run
 * @author BakxY
 */
export function getCommand(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.commands.registerCommand('vhdl-qqs.selectQuestaTestScript', async () => {
        if (!vscode.workspace.getConfiguration('vhdl-qqs').get('questaFeatureFlag')) {
            vscode.window.showErrorMessage('Feature isn\'t enabled!');
            console.error('Feature isn\'t enabled!');
            outputChannel.appendLine('Feature isn\'t enabled!');
            return;
        }

        pathUtils.getCurrentQuestaProject(context);

        const availableTestScripts: string[] = questa.getAllTestRunnerScripts();
 
        // Check if there are any quartus project file are in current workspace
        if (availableTestScripts.length === 0) {
            vscode.window.showErrorMessage('There are no questa test scripts in your workfolder!');
            console.error('There are no questa test scripts in your workfolder!');
            outputChannel.appendLine('There are no questa test scripts in your workfolder!');
            return;
        }

        // Ask user to select a project
        const selectedTestScript: string | undefined = await vscode.window.showQuickPick(availableTestScripts, { title: 'Select a questa test script' });
        if (selectedTestScript === undefined) { return; }

        // Update workspace storage
        context.workspaceState.update('vhdl-qqs.currentActiveQuestaTestScript', selectedTestScript);
    });
} 