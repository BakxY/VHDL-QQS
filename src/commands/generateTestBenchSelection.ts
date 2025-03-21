import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as cp from 'child_process';

// Import custom libs
import * as entityUtils from './../lib/EntityUtils';
import * as testbenchCommands from './../lib/TestbenchCommand';
import * as tomlUtils from './../lib/TomlUtils';
import * as quartus from './../lib/QuartusUtils';
import * as questa from './../lib/QuestaUtils';
import * as compileCommands from './../lib/CompileCommand';
import * as testCommands from './../lib/TestCommands';
import * as statusBarCreator from './../lib/StatusBarUtils';
import * as pathUtils from './../lib/PathUtils';
import * as vhdlLang from './../lib/VhdlLang';

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