import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as pathUtils from './PathUtils'

/**
 * @brief Runs all support function to compile a quartus project and start a terminal with running compilation
 * 
 * @param context Context from where the command was ran
 * @param currentProjectPath Path to the currently selected project
 * @param pathToQuartus Path to the users quartus installation, where the binaries reside
 */
export function compileQuartusProject(context: vscode.ExtensionContext, currentProjectPath: string, quartusBinPath: string) {
    const totalProjectPath = path.join(pathUtils.getWorkspacePath()!, currentProjectPath);
    const totalQuartusBinPath = path.join(quartusBinPath, 'quartus_sh');
    const totalScriptPath = path.join(context.extensionPath, 'res', 'compile.tcl');

    const scriptCmdArgs = '"' + totalProjectPath + '"'
    
    const scriptCmd = '"' + totalQuartusBinPath + '" -t "' + totalScriptPath + '" ' + scriptCmdArgs;;

    let terminal = vscode.window.activeTerminal;
    if (!terminal) {
        terminal = vscode.window.createTerminal('Quartus Compilation');
    }

    terminal.show();
    terminal.sendText(scriptCmd);

    console.log('Started compilation in terminal!');
    vscode.window.showInformationMessage('Started compilation in terminal!');
}