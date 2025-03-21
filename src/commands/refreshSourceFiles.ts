import * as vscode from 'vscode';

// Import custom libs
import * as pathUtils from './../lib/PathUtils';

import { quartusProjectFilesView } from '../extension';

export function getCommand(context: vscode.ExtensionContext) {
    return vscode.commands.registerCommand('vhdl-qqs.refreshSourceFiles', async () => {
        // Get currently active project
        const activeProject: string | null = await pathUtils.getCurrentQuartusProject(context);
        if (activeProject === null) { return; }

        // Get  quartus install bin path
        const quartusPath: string | null = await pathUtils.getQuartusBinPath();
        if (quartusPath === null) { return; }

        quartusProjectFilesView.updateData(context, activeProject, quartusPath);
        vscode.window.showInformationMessage('Refreshed source file list!');
    });
} 