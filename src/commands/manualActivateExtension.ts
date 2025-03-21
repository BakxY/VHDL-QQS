import * as vscode from 'vscode';

export function getCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('vhdl-qqs.manualActivateExtension', () => {
        vscode.commands.executeCommand('workbench.action.reloadWindow');
    });
} 