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
    return vscode.commands.registerCommand('vhdl-qqs.removeFileFromProjectContext', async (uri: vscode.Uri) => {
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
                if (!allVhdlFiles.includes(relativePath)) {
                    vscode.window.showInformationMessage('Was\'t part of project!');
                    return;
                }
                quartus.removeVhdlFileToProject(context, activeProject, quartusPath, relativePath);
                break;

            case '.v':
                const allVerilogFiles = quartus.getProjectVerilogSourceFiles(context, activeProject, quartusPath);
                if (!allVerilogFiles.includes(relativePath)) {
                    vscode.window.showInformationMessage('Was\'t part of project!');
                    return;
                }
                quartus.removeVerilogFileToProject(context, activeProject, quartusPath, relativePath);
                break;
        }
        quartusProjectFilesView.updateData(context, activeProject, quartusPath);
        vscode.window.showInformationMessage('Removed file from active project!');
    });
} 