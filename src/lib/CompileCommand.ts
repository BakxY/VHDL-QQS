import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import process from 'process';

export function compileQuartusProject(context: vscode.ExtensionContext, currentProjectPath: string, pathToQuartus: string) {
    const PATH_TO_COMPILE_SCRIPT_TEMPLATE: string = path.join(context.extensionPath, 'res', 'compile.tcl');

    console.log('Loading compile script template file from "' + PATH_TO_COMPILE_SCRIPT_TEMPLATE + '"');

    let generatedCompileScript: string = fs.readFileSync(PATH_TO_COMPILE_SCRIPT_TEMPLATE, 'utf-8');

    generatedCompileScript = generatedCompileScript.replace('CURRENT_PROJECT', currentProjectPath.replaceAll('\\', '/'));

    if (fs.existsSync('compile.tcl')) {
        console.warn('Removing old version of compile script!');
        fs.rmSync('compile.tcl');
    }

    console.log('Writing compile script to workspace!');

    fs.writeFileSync('compile.tcl', generatedCompileScript);

    let terminal = vscode.window.activeTerminal;
    if (!terminal) {
        terminal = vscode.window.createTerminal('Quartus Compilation');
    }

    terminal.show();
    terminal.sendText('"' + path.join(pathToQuartus, 'quartus_sh') + '"' + ' -t compile.tcl');

    console.warn('Started compilation in terminal!');
    vscode.window.showInformationMessage('Started compilation in terminal!');
}