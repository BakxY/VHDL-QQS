import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * @brief Runs all support function to compile a quartus project and start a terminal with running compilation
 * 
 * @param context Context from where the command was ran
 * @param currentProjectPath Path to the currently selected project
 * @param pathToQuartus Path to the users quartus installation, where the binaries reside
 */
export function compileQuartusProject(context: vscode.ExtensionContext, currentProjectPath: string, pathToQuartus: string) {
    const PATH_TO_COMPILE_SCRIPT_TEMPLATE: string = path.join(context.extensionPath, 'res', 'compile.tcl');

    console.log('Loading compile script template file from "' + PATH_TO_COMPILE_SCRIPT_TEMPLATE + '"');

    let generatedCompileScript: string = fs.readFileSync(PATH_TO_COMPILE_SCRIPT_TEMPLATE, 'utf-8');

    generatedCompileScript = generatedCompileScript.replace('CURRENT_PROJECT', currentProjectPath.replaceAll('\\', '/'));

    const compileScriptPath = path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, 'compile.tcl')

    if (fs.existsSync(compileScriptPath)) {
        console.warn('Removing old version of compile script!');
        fs.rmSync(compileScriptPath);
    }

    console.log('Writing compile script to workspace!');

    fs.writeFileSync(compileScriptPath, generatedCompileScript);

    let terminal = vscode.window.activeTerminal;
    if (!terminal) {
        terminal = vscode.window.createTerminal('Quartus Compilation');
    }

    terminal.show();
    terminal.sendText('"' + path.join(pathToQuartus, 'quartus_sh') + '"' + ' -t compile.tcl');

    console.log('Started compilation in terminal!');
    vscode.window.showInformationMessage('Started compilation in terminal!');
}