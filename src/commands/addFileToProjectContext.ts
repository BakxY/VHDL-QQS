import * as vscode from 'vscode';
import * as path from 'path';

// Import custom libs
import * as quartus from './../lib/QuartusUtils';
import * as pathUtils from './../lib/PathUtils';

import { quartusProjectFilesView } from '../extension';

export function getCommand(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.commands.registerCommand('vhdl-qqs.addFileToProjectContext', async (uri: vscode.Uri) => {
        const filePath: string = path.normalize(uri.fsPath);
        if (!['.vhd', '.v'].includes(path.extname(filePath))) { return; }

        // Get currently active project
        const activeProject: string | null = await pathUtils.getCurrentQuartusProject(context);
        if (activeProject === null) { return; }

        // Get  quartus install bin path
        const quartusPath: string | null = await pathUtils.getQuartusBinPath();
        if (quartusPath === null) { return; }

        const relativePath = path.relative(path.dirname(path.join(pathUtils.getWorkspacePath()!, activeProject)), filePath).replaceAll('\\', '/');

        switch (path.extname(filePath)) {
            case '.vhd':
                const allVhdlFiles = quartus.getProjectVhdlSourceFiles(context, activeProject, quartusPath);
                if (allVhdlFiles.includes(relativePath)) {
                    vscode.window.showInformationMessage('File is already part of active project!');
                    return;
                }
                quartus.addVhdlFileToProject(context, activeProject, quartusPath, relativePath);
                break;

            case '.v':
                const allVerilogFiles = quartus.getProjectVerilogSourceFiles(context, activeProject, quartusPath);
                if (allVerilogFiles.includes(relativePath)) {
                    vscode.window.showInformationMessage('File is already part of active project!');
                    return;
                }
                quartus.addVerilogFileToProject(context, activeProject, quartusPath, relativePath);
                break;
        }
        quartusProjectFilesView.updateData(context, activeProject, quartusPath);
        vscode.window.showInformationMessage('Added file to active project!');
    });
} 