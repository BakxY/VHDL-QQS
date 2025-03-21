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