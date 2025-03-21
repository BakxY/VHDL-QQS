import * as vscode from 'vscode';

// Import custom libs
import * as entityUtils from './../lib/EntityUtils';
import * as testbenchCommands from './../lib/TestbenchCommand';

import { outputChannel } from '../extension';

/**
 * @brief Command generates a new testbench for a entity. This commands uses the user selected expression as the entity to generate the testbench for.
 * @author BakxY
 */
export function getCommand(context: vscode.ExtensionContext): vscode.Disposable {
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