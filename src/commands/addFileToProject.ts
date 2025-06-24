import * as vscode from 'vscode';
import * as path from 'path';

// Import custom libs
import * as quartus from '../lib/QuartusUtils';
import * as pathUtils from '../lib/PathUtils';

import { outputChannel, quartusProjectFilesView } from '../extension';

/**
 * @brief Command used to remove the file currently open in the editor from the current project.
 * @author BakxY
 */
export function getCommand(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.commands.registerCommand('vhdl-qqs.addFileToProject', async (uri: vscode.Uri) => {
        const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;

        // Check if editor is opened
        if (editor === undefined) {
            vscode.window.showErrorMessage('No open file!');
            console.error('No open file!');
            outputChannel.appendLine('No open file!');
            return;
        }

        const filePath: string = path.normalize(editor.document.fileName);
        if (!['.vhd', '.v'].includes(path.extname(filePath))) {
            vscode.window.showErrorMessage('Only VHDL and Verilog files can be added to quartus projects!');
            console.error('Only VHDL and Verilog files can be added to quartus projects!');
            outputChannel.appendLine('Only VHDL and Verilog files can be added to quartus projects!');
            return;
        }

        // Get currently active project
        const activeProject: string | null = await pathUtils.getCurrentQuartusProject(context);
        if (activeProject === null) { return; }

        // Get  quartus install bin path
        const quartusPath: string | null = await pathUtils.getQuartusBinPath();
        if (quartusPath === null) { return; }

        const relativePath = path.relative(path.dirname(path.join(pathUtils.getWorkspacePath()!, activeProject)), filePath).replaceAll('\\', '/');

        switch (path.extname(filePath)) {
            case '.vhd':
                const allVhdlFiles = quartus.getProjectVhdlSourceFiles(context, activeProject, quartusPath);
                if (allVhdlFiles.includes(relativePath)) {
                    vscode.window.showWarningMessage('File is already part of active project!');
                    return;
                }
                quartus.addVhdlFileToProject(context, activeProject, quartusPath, relativePath);
                break;

            case '.v':
                const allVerilogFiles = quartus.getProjectVerilogSourceFiles(context, activeProject, quartusPath);
                if (allVerilogFiles.includes(relativePath)) {
                    vscode.window.showWarningMessage('File is already part of active project!');
                    return;
                }
                quartus.addVerilogFileToProject(context, activeProject, quartusPath, relativePath);
                break;

            default:
                return;
        }
        quartusProjectFilesView.updateData(context, activeProject, quartusPath);
        vscode.window.showInformationMessage('Added file to active project!');
    });
} 