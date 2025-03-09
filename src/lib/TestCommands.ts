import * as vscode from 'vscode';
import * as path from 'path';
import * as pathUtils from './PathUtils';

/**
 * @brief TODO
 * 
 * @param context Context from where the command was ran
 * @param currentProjectPath Path to the currently selected project
 * @param pathToQuesta Path to the users Questa installation, where the binaries reside
 */
export function runQuestaTest(context: vscode.ExtensionContext, currentProjectPath: string, pathToQuesta: string) {
    const pathToProject = path.dirname(path.join(pathUtils.getWorkspacePath()!, currentProjectPath));

    const pathToTests: string | undefined = vscode.workspace.getConfiguration('vhdl-qqs').get<string>('questaTestsPath');

    if (pathToTests === undefined) {
        console.error('No path to do tests file defined! Check your settings!');
        vscode.window.showErrorMessage('No path to do tests file defined! Check your settings!');
        return;
    }

    const scriptCmd = 'vsim -c -do ' + pathToTests.replaceAll('\\', '/') + ' -do exit';

    // Get all active terminals opened in editor
    let openTerminals = vscode.window.terminals;
    let QuestaCompileShell: vscode.Terminal | undefined = undefined;

    // Filter for Questa terminal
    for (let index = 0; index < openTerminals.length; index++) {
        if (openTerminals[index].name === 'Questa Tests') {
            QuestaCompileShell = openTerminals[index];
        }
    }

    // Check if a Questa shell was found
    if (!QuestaCompileShell) {
        QuestaCompileShell = vscode.window.createTerminal('Questa Tests');
    }

    QuestaCompileShell.show();
    QuestaCompileShell.sendText('cd "' + pathToProject + '"');
    QuestaCompileShell.sendText(scriptCmd);

    console.log('Started test run in terminal!');
    vscode.window.showInformationMessage('Started test run in terminal!');
}