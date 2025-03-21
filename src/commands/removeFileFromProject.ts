import * as vscode from 'vscode';
import * as path from 'path';

// Import custom libs
import * as quartus from './../lib/QuartusUtils';
import * as pathUtils from './../lib/PathUtils';

import { quartusProjectFilesView } from '../extension';

export function getCommand(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.commands.registerCommand('vhdl-qqs.removeFileFromProject', async () => {
        // Get currently active project
        const activeProject: string | null = await pathUtils.getCurrentQuartusProject(context);
        if (activeProject === null) { return; }

        // Get  quartus install bin path
        const quartusPath: string | null = await pathUtils.getQuartusBinPath();
        if (quartusPath === null) { return; }

        let allProjectFiles: string[] = [];

        allProjectFiles = allProjectFiles.concat(quartus.getProjectVhdlSourceFiles(context, activeProject, quartusPath));
        allProjectFiles = allProjectFiles.concat(quartus.getProjectVerilogSourceFiles(context, activeProject, quartusPath));

        // Ask user to pick a entity
        const fileToRemove: string | undefined = await vscode.window.showQuickPick(allProjectFiles, { title: 'Select a file to remove from project' });
        if (fileToRemove === undefined) { return; }

        switch (path.extname(fileToRemove)) {
            case '.vhd':
                quartus.removeVhdlFileToProject(context, activeProject, quartusPath, fileToRemove);
                break;

            case '.v':
                quartus.removeVerilogFileToProject(context, activeProject, quartusPath, fileToRemove);
                break;
        }

        quartusProjectFilesView.updateData(context, activeProject, quartusPath);
        vscode.window.showInformationMessage('Removed file to active project!');
    });
} 