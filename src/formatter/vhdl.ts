import * as vscode from 'vscode';
import * as path from 'path';
import * as cp from 'child_process';

// Import custom libs
import * as vhdlLang from './../lib/VhdlLang';

import { outputChannel } from '../extension';

export function getFormatter(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.languages.registerDocumentFormattingEditProvider('vhdl', {
        async provideDocumentFormattingEdits(document: vscode.TextDocument): Promise<vscode.TextEdit[]> {
            const edits: vscode.TextEdit[] = [];

            const pathToBin = path.join(context.extensionPath, 'res', 'vhdl_lang');

            if (!vhdlLang.checkForVhdlLang(context)) {
                vscode.window.showErrorMessage('No VHDL_lang executable found! Trying to download VHDL_lang!');
                console.error('No VHDL_lang executable found! Trying to download VHDL_lang!');
                outputChannel.appendLine('No VHDL_lang executable found! Trying to download VHDL_lang!');
                vhdlLang.checkDownloadVhdlLang(context);
                return edits;
            }

            // Save document before formatting it
            await document.save();

            const fullRange: vscode.Range = new vscode.Range(0, 0, document.lineCount, 0);
            const execString: string = '"' + pathToBin + '" --format "' + document.uri.fsPath + '"';
            let formattedFile: Buffer<ArrayBufferLike> = Buffer.from([]);

            try {
                formattedFile = cp.execSync(execString);
            }
            catch (err) {
                if (err instanceof Error) {
                    const processError = err as (Error & { stderr?: Buffer; stdout?: Buffer });

                    console.error('Error while executing "' + execString + '"!\nerror dump:\n' + processError.stdout?.toString());
                    outputChannel.appendLine('Error while executing "' + execString + '"!\nerror dump:\n' + processError.stdout?.toString());

                    vscode.window.showErrorMessage('You can\'t format a file with broken syntax! Fix syntax before formatting file! Check output to see error!');
                    outputChannel.show();
                }
                else {
                    console.error('Error while executing "' + execString + '"!\nerror dump:\n' + err);
                    outputChannel.appendLine('Error while executing "' + execString + '"!\nerror dump:\n' + err);
                    vscode.window.showErrorMessage('Error while executing "' + execString + '"!\nerror dump:\n' + err);
                }

                return edits;
            }

            edits.push(vscode.TextEdit.replace(fullRange, formattedFile.toString()));

            return edits;
        }
    });
}