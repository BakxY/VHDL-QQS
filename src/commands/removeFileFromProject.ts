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