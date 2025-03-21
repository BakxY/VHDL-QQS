import * as vscode from 'vscode';
import * as path from 'path';

// Import custom libs
import * as testbenchCommands from './../lib/TestbenchCommand';
import * as tomlUtils from './../lib/TomlUtils';
import * as pathUtils from './../lib/PathUtils';

import { outputChannel } from '../extension';

/**
 * @brief Command generates a new testbench for a entity. This commands uses the toml file to get available entities and present the user with a menu selection.
 * @author BakxY
 */
export function getCommand(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.commands.registerCommand('vhdl-qqs.generateTestBenchExplorer', async () => {
        // Get toml file path set in vs code setting
        const pathToToml = pathUtils.getTomlLocalPath();
        if (pathToToml === null) { return; }

        // Get all entities listed in toml file
        const allEntities = tomlUtils.getAllEntities(pathUtils.getWorkspacePath()!, pathToToml);
        if (allEntities === null) { return; }

        const allEntityNames: string[] = [];

        // Remove file extensions
        for (let entity = 0; entity < allEntities.length; entity++) {
            allEntityNames[entity] = path.basename(allEntities[entity]).replace(path.extname(allEntities[entity]), '');
        }

        // Ask user to pick a entity
        const selectedEntity: string | undefined = await vscode.window.showQuickPick(allEntityNames.sort(), { title: 'Select a entity to create a testbench' });
        if (selectedEntity === undefined) { return; }

        // Check if a testbench was selected to create a testbench
        if (selectedEntity.endsWith('_tb')) {
            vscode.window.showErrorMessage('Can\'t create a testbench of a testbench!');
            console.error('Can\'t create a testbench of a testbench!');
            outputChannel.appendLine('Can\'t create a testbench of a testbench!');
            return;
        }

        // Check if testbench for selected entity already exists
        if (allEntities.includes(selectedEntity + '_tb')) {
            vscode.window.showErrorMessage('The testbench for this entity already exists!');
            console.error('The testbench for this entity already exists!');
            outputChannel.appendLine('The testbench for this entity already exists!');
            return;
        }

        let pathToEntityFile: string = '';

        // Check if selected entity has a entity file
        for (const entity in allEntities) {
            if (allEntities[entity].endsWith(selectedEntity + '.vhd')) {
                pathToEntityFile = allEntities[entity];
                console.log('Found file associated with selected entity at "' + allEntities[entity] + '"');
                outputChannel.appendLine('Found file associated with selected entity at "' + allEntities[entity] + '"');
                break;
            }
        }

        // Trow error if no file was found
        if (pathToEntityFile === '') {
            vscode.window.showErrorMessage('Selected expression is not defined as a entity in your project!');
            console.error('Selected expression is not defined as a entity in your project!');
            outputChannel.appendLine('Selected expression is not defined as a entity in your project!');
            return;
        }

        testbenchCommands.createNewTestbench(context, selectedEntity, pathToEntityFile);
    });
} 