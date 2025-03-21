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
    return vscode.commands.registerCommand('vhdl-qqs.genDebugDevInfo', async () => {
        outputChannel.appendLine('\nCollected debug information: ')
        outputChannel.appendLine('* OS: ' + process.platform);
        outputChannel.appendLine('* VS Code version: ' + vscode.version);
        outputChannel.appendLine('* Extension version: ' + vscode.extensions.getExtension('bakxy.vhdl-qqs')?.packageJSON.version);

        // Get quartus install bin path
        const quartusPath: string | null = await pathUtils.getQuartusBinPath();
        if (quartusPath === null) {
            outputChannel.appendLine('* Quartus version: not (correctly) configured');
        }
        else {
            outputChannel.appendLine('* Quartus version: ' + quartus.checkQuartusVersion(quartusPath));
        }

        outputChannel.show();
    });
} 