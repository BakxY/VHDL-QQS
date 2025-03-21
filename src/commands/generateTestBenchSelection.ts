import * as vscode from 'vscode';

// Import custom libs
import * as entityUtils from './../lib/EntityUtils';
import * as testbenchCommands from './../lib/TestbenchCommand';

import { outputChannel } from '../extension';

export function getCommand(context: vscode.ExtensionContext) {
    return vscode.commands.registerCommand('vhdl-qqs.generateTestBenchSelection', () => {
        const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
    
        // Check if editor is opened
        if (editor === undefined) {
            vscode.window.showErrorMessage('No editor opened!');
            console.error('No editor opened!');
            outputChannel.appendLine('No editor opened!');
            return;
        }
    
        console.log('Found current open file "' + editor.document.fileName + '"');
        outputChannel.appendLine('Found current open file "' + editor.document.fileName + '"');
    
        const selectedExpression: string | null = entityUtils.getSelectedExpression(editor);
        if (selectedExpression === null) { return; }
    
        testbenchCommands.createNewTestbench(context, selectedExpression, editor.document.fileName);
    });
} 