import * as vscode from 'vscode';
import * as path from 'path';
import * as pathUtils from './PathUtils';
import { outputChannel } from '../extension';

const PATH_TO_CMD: string = '/Windows/System32/cmd.exe';

/**
 * @brief TODO
 * 
 * @param context Context from where the command was ran
 * @param currentProjectPath Path to the currently selected project
 * @param pathToQuesta Path to the users Questa installation, where the binaries reside
 */
export function runQuestaTest(context: vscode.ExtensionContext, currentProjectPath: string, pathToQuesta: string): void {
    const pathToProject = path.dirname(path.join(pathUtils.getWorkspacePath()!, currentProjectPath));
    const pathToVsim = path.join(pathToQuesta, 'vsim');

    const pathToTests: string | undefined = vscode.workspace.getConfiguration('vhdl-qqs').get<string>('questaTestsPath');

    if (pathToTests === undefined) {
        console.error('No path to do tests file defined! Check your settings!');
        vscode.window.showErrorMessage('No path to do tests file defined! Check your settings!');
        outputChannel.appendLine('No path to do tests file defined! Check your settings!');
        return;
    }

    const scriptCmd = '"' + pathToVsim + '" -c -do ' + pathToTests.replaceAll('\\', '/') + ' -do exit';

    // Get all active terminals opened in editor
    const openTerminals = vscode.window.terminals;
    let QuestaCompileShell: vscode.Terminal | undefined = undefined;

    // Filter for Questa terminal
    for (let index = 0; index < openTerminals.length; index++) {
        if (openTerminals[index].name === 'Questa Tests') {
            QuestaCompileShell = openTerminals[index];
        }
    }

    // Check if a Questa shell was found
    if (!QuestaCompileShell) {
        switch (process.platform) {
            case 'win32':
                QuestaCompileShell = vscode.window.createTerminal('Questa Tests', PATH_TO_CMD);
                break;
            default:
                QuestaCompileShell = vscode.window.createTerminal('Questa Tests');
        }
    }

    QuestaCompileShell.show();
    QuestaCompileShell.sendText('cd "' + pathToProject + '"');
    QuestaCompileShell.sendText(scriptCmd);

    console.log('Started test run in terminal!');
    vscode.window.showInformationMessage('Started test run in terminal!');
    outputChannel.appendLine('Started test run in terminal!');
}