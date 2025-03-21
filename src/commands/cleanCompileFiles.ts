import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// Import custom libs
import * as pathUtils from './../lib/PathUtils';

import { outputChannel } from '../extension';

export function getCommand(context: vscode.ExtensionContext) {
    return vscode.commands.registerCommand('vhdl-qqs.cleanCompileFiles', async () => {
        // Get currently active project
        const activeProject: string | null = await pathUtils.getCurrentQuartusProject(context);
        if (activeProject === null) { return; }

        // Create full folder path
        const folderToClean = path.join(pathUtils.getWorkspacePath()!, path.dirname(activeProject));

        // Try to delete folders
        try {
            fs.rmSync(path.join(folderToClean, 'output_files'), { recursive: true });
        }
        catch (err) {
            console.warn(err);
        }

        try {
            fs.rmSync(path.join(folderToClean, 'db'), { recursive: true });
        }
        catch (err) {
            console.warn(err);
        }

        try {
            fs.rmSync(path.join(folderToClean, 'incremental_db'), { recursive: true });
        }
        catch (err) {
            console.warn(err);
        }

        vscode.window.showInformationMessage('Finished cleaning project output files!');
        console.log('Finished cleaning project output files!');
        outputChannel.appendLine('Finished cleaning project output files!');
    });
} 