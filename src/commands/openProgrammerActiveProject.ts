import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as cp from 'child_process';

// Import custom libs
import * as pathUtils from './../lib/PathUtils';

import { outputChannel } from '../extension';

export function getCommand(context: vscode.ExtensionContext) {
    return vscode.commands.registerCommand('vhdl-qqs.openProgrammerActiveProject', async () => {
        // Get currently active project
        const activeProject: string | null = await pathUtils.getCurrentQuartusProject(context);
        if (activeProject === null) { return; }

        // Get  quartus install bin path
        const quartusPath: string | null = await pathUtils.getQuartusBinPath();
        if (quartusPath === null) { return; }

        // Create full path for programming file
        const fileToUpload = path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, path.dirname(activeProject), 'output_files', path.basename(activeProject).replace(path.extname(activeProject), '') + '.sof');

        // check if file exists (if project was compiled)
        if (!fs.existsSync(fileToUpload)) {
            vscode.window.showErrorMessage('No compiled project found! Compile project before opening programmer!');
            console.error('No compiled project found! Compile project before opening programmer!');
            outputChannel.appendLine('No compiled project found! Compile project before opening programmer!');
            return;
        }

        // Create full programmer binary path
        const programmerFilePath = path.join(path.normalize(quartusPath), 'quartus_pgmw');

        // Start programmer
        cp.exec('"' + programmerFilePath + '" "' + fileToUpload + '"');

        vscode.window.showInformationMessage('Opening programmer for project "' + path.basename(activeProject).replace(path.extname(activeProject), '') + '"');
    });
} 