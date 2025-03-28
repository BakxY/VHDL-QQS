import * as vscode from 'vscode';
import * as path from 'path';

// Import custom libs
import * as compileCommands from './../lib/CompileCommand';
import * as pathUtils from './../lib/PathUtils';

/**
 * @brief Commands created and runs a tcl script in the quartus tcl shell that will compile the currently active project.
 * @author BakxY
 */
export function getCommand(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.commands.registerCommand('vhdl-qqs.compileCurrentProject', async () => {
        // Get currently active project
        const activeProject: string | null = await pathUtils.getCurrentQuartusProject(context);
        if (activeProject === null) { return; }

        // Get  quartus install bin path
        const quartusPath: string | null = await pathUtils.getQuartusBinPath();
        if (quartusPath === null) { return; }

        // Run compile command
        compileCommands.compileQuartusProject(context, activeProject, path.normalize(quartusPath));
    });
} 