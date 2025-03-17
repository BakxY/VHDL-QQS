import * as vscode from 'vscode';
import * as path from 'path';
import * as pathUtils from './PathUtils';
import { outputChannel } from '../extension';

const PATH_TO_CMD: string = '/Windows/System32/cmd.exe';

/**
 * @brief Runs all support function to compile a quartus project and start a terminal with running compilation
 * 
 * @param context Context from where the command was ran
 * @param currentProjectPath Path to the currently selected project
 * @param pathToQuartus Path to the users quartus installation, where the binaries reside
 */
export function compileQuartusProject(context: vscode.ExtensionContext, currentProjectPath: string, quartusBinPath: string): void {
    const totalProjectPath = path.join(pathUtils.getWorkspacePath()!, currentProjectPath);
    const totalQuartusBinPath = path.join(quartusBinPath, 'quartus_sh');
    const totalScriptPath = path.join(context.extensionPath, 'res', 'compile.tcl');

    const scriptCmdArgs = '"' + totalProjectPath + '"';

    const scriptCmd = '"' + totalQuartusBinPath + '" -t "' + totalScriptPath + '" ' + scriptCmdArgs;

    // Get all active terminals opened in editor
    const openTerminals = vscode.window.terminals;
    let quartusCompileShell: vscode.Terminal | undefined = undefined;

    // Filter for quartus terminal
    for (let index = 0; index < openTerminals.length; index++) {
        if (openTerminals[index].name === 'Quartus Compilation') {
            quartusCompileShell = openTerminals[index];
        }
    }

    // Check if a quartus shell was found
    if (!quartusCompileShell) {
        switch (process.platform) {
            case 'win32':
                quartusCompileShell = vscode.window.createTerminal('Quartus Compilation', PATH_TO_CMD);
                break;
            default:
                quartusCompileShell = vscode.window.createTerminal('Quartus Compilation');
        }
    }

    quartusCompileShell.show();
    quartusCompileShell.sendText(scriptCmd);

    console.log('Started compilation in terminal!');
    vscode.window.showInformationMessage('Started compilation in terminal!');
    outputChannel.append('Started compilation in terminal!');
}