import * as vscode from 'vscode';

/**
 * @brief Command that reloads entire VS Code windows so the extension restarts.
 * @author BakxY
 */
export function getCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('vhdl-qqs.manualActivateExtension', () => {
        vscode.commands.executeCommand('workbench.action.reloadWindow');
    });
} 