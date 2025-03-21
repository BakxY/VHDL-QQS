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
    return vscode.commands.registerCommand('vhdl-qqs.openRtlViewerActiveProject', async () => {
        // Get currently active project
        const activeProject: string | null = await pathUtils.getCurrentQuartusProject(context);
        if (activeProject === null) { return; }

        // Get  quartus install bin path
        const quartusPath: string | null = await pathUtils.getQuartusBinPath();
        if (quartusPath === null) { return; }

        // Create full path for programming file
        const fileToOpen = path.join(pathUtils.getWorkspacePath()!, path.dirname(activeProject), path.basename(activeProject)).replace('.qsf', '.qpf');

        // check if file exists (if project was compiled)
        if (!fs.existsSync(fileToOpen)) {
            vscode.window.showErrorMessage('Project file doesn\'t exits! Please open a valid project!');
            console.error('Project file doesn\'t exits! Please open a valid project!');
            outputChannel.appendLine('Project file doesn\'t exits! Please open a valid project!');
            return;
        }

        // Create full programmer binary path
        const rtlViewerFilePath = path.join(path.normalize(quartusPath), 'qnui');

        // Start programmer
        cp.exec('"' + rtlViewerFilePath + '" "' + fileToOpen + '"');

        vscode.window.showInformationMessage('Opening RTL Viewer for project "' + path.basename(activeProject).replace(path.extname(activeProject), '') + '"');
    });
} 