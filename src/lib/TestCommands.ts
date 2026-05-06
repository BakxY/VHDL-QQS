import * as vscode from 'vscode';
import * as path from 'path';
import * as cp from 'child_process';
import * as pathUtils from './PathUtils';
import { outputChannel } from '../extension';

const PATH_TO_CMD: string = '/Windows/System32/cmd.exe';

/**
 * @brief Run the active Questa testbench and shows output in a VS Code terminal.
 * 
 * @param currentProjectPath Path to the currently selected project
 * @param currentTestScriptPath Path to the currently selected test script
 * @param pathToQuesta Path to the users Questa installation, where the binaries reside
 */
export function runQuestaTest(currentProjectPath: string, currentTestScriptPath: string, pathToQuesta: string): void {
    const pathToProject = path.dirname(path.join(pathUtils.getWorkspacePath()!, currentProjectPath));
    const pathToTestScript = path.join(pathUtils.getWorkspacePath()!, currentTestScriptPath);
    const pathToVsim = path.join(pathToQuesta, 'vsim');

    const scriptCmd = '"' + pathToVsim + '" -c -do ' + pathToTestScript.replaceAll('\\', '/') + ' -do exit';

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

/**
 * @brief Converts a .wlf file resulting from a Questa run into a .vcd file and uses VaporView to open that file.
 * 
 * @param currentProjectPath Path to the currently selected project
 * @param pathToQuesta Path to the users Questa installation, where the binaries reside
 */
export async function convertAndOpenWaveFile(currentProjectPath: string, pathToQuesta: string): Promise<void> {
    const pathToProject = path.dirname(path.join(pathUtils.getWorkspacePath()!, currentProjectPath));
    const pathToWlf = path.join(pathToProject, 'vsim.wlf');
    const pathToVcd = path.join(pathToProject, 'vsim.vcd');
    const pathToVsim = path.join(pathToQuesta, 'wlf2vcd');

    const scriptCmd = '"' + pathToVsim + '" ' + pathToWlf.replaceAll('\\', '/') + ' -o "' + pathToVcd.replaceAll('\\', '/') + '"';

    try {
        cp.execSync(scriptCmd, { encoding: 'utf8' });
    }
    catch (err) {
        console.error('Error while executing "' + scriptCmd + '"!\nerror dump:\n' + err);
        vscode.window.showErrorMessage('Error while executing "' + scriptCmd + '"!\nerror dump:\n' + err);
        outputChannel.appendLine('Error while executing "' + scriptCmd + '"!\nerror dump:\n' + err);
        return;
    }

    if(vscode.extensions.getExtension('lramseyer.vaporview') === undefined) {
        console.error('The VaporView extension is required to view the VCD file! Please install it from the Marketplace!');
        vscode.window.showErrorMessage('The VaporView extension is required to view the VCD file! Please install it from the Marketplace!');
        outputChannel.appendLine('The VaporView extension is required to view the VCD file! Please install it from the Marketplace!');
        return;
    }

    await vscode.commands.executeCommand('vaporview.openFile', {
        uri: vscode.Uri.file(pathToVcd),
        loadAll: false,
        maxSignals: 64
    });
}