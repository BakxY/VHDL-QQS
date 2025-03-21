import * as vscode from 'vscode';

// Import custom libs
import * as quartus from './../lib/QuartusUtils';
import * as pathUtils from './../lib/PathUtils';

import { outputChannel } from '../extension';

/**
 * @brief Command that connects and prints device and software information required in bug reports
 * @author BakxY
 */
export function getCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('vhdl-qqs.genDebugDevInfo', async () => {
        outputChannel.appendLine('\nCollected debug information: ');
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