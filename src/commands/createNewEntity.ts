import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// Import custom libs
import * as quartus from './../lib/QuartusUtils';
import * as pathUtils from './../lib/PathUtils';

import { outputChannel } from '../extension';

export function getCommand(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.commands.registerCommand('vhdl-qqs.createNewEntity', async () => {
        // Get currently active project
        const activeProject: string | null = await pathUtils.getCurrentQuartusProject(context);
        if (activeProject === null) { return; }

        // Get  quartus install bin path
        const quartusPath: string | null = await pathUtils.getQuartusBinPath();
        if (quartusPath === null) { return; }



        const entityName: string | undefined = await vscode.window.showInputBox({ title: 'Enter the identifier for the new entity' });
        if (entityName === undefined) { return; }

        if (entityName.endsWith('_tb')) {
            vscode.window.showErrorMessage('Entity name can\'t end in "_tp"! Suffix "_tp" is reserved for testbenches!');
            console.error('Entity name can\'t end in "_tp"! Suffix "_tp" is reserved for testbenches!');
            outputChannel.appendLine('Entity name can\'t end in "_tp"! Suffix "_tp" is reserved for testbenches!');
            return;
        }

        // Get all files included in the current project
        let allProjectFiles: string[] = [];
        allProjectFiles = allProjectFiles.concat(quartus.getProjectVhdlSourceFiles(context, activeProject, quartusPath));
        allProjectFiles = allProjectFiles.concat(quartus.getProjectVerilogSourceFiles(context, activeProject, quartusPath));

        // Check if there already exits a entity with user specified name
        for (let fileIndex = 0; fileIndex < allProjectFiles.length; fileIndex++) {
            if (path.basename(allProjectFiles[fileIndex]).replace(path.extname(allProjectFiles[fileIndex]), '') === entityName) {
                vscode.window.showErrorMessage('There already exists a entity with the name "' + entityName + '" in current project!');
                console.error('There already exists a entity with the name "' + entityName + '" in current project!');
                outputChannel.appendLine('There already exists a entity with the name "' + entityName + '" in current project!');
                return;
            }
        }

        // Ask user where to save the new entity to
        const targetFolder: vscode.Uri[] | undefined = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            canSelectMany: false,
            openLabel: 'Select Folder',
            title: 'Select folder to store the new entity in'
        });
        if (targetFolder === undefined) { return; }

        const targetFilePath = path.join(targetFolder[0].fsPath, entityName + '.vhd');

        // Check if file already exists
        if (fs.existsSync(targetFilePath)) {
            vscode.window.showErrorMessage('Target file already exists at "' + targetFilePath + '"');
            console.error('Target file already exists at "' + targetFilePath + '"');
            outputChannel.appendLine('Target file already exists at "' + targetFilePath + '"');
            return;
        }

        // Generate entire path for template file
        const PATH_TO_ENTITY_TEMPLATE: string = path.join(context.extensionPath, 'res', 'entity_template.vhd');
        console.log('Loading template file from "' + PATH_TO_ENTITY_TEMPLATE + '"');
        outputChannel.appendLine('Loading template file from "' + PATH_TO_ENTITY_TEMPLATE + '"');

        let generatedEntity: string = fs.readFileSync(PATH_TO_ENTITY_TEMPLATE, 'utf-8');

        // Populate template
        generatedEntity = generatedEntity.replaceAll('ENTITY_NAME', entityName);
        generatedEntity = generatedEntity.replaceAll('DATE_CREATED', new Date().toLocaleDateString('de-CH'));

        // Write template to fs
        console.log('Writing template to "' + generatedEntity + '"');
        outputChannel.appendLine('Writing template to "' + generatedEntity + '"');
        fs.writeFileSync(targetFilePath, generatedEntity);

        // Add file to project as source file
        const relativePath = path.relative(path.dirname(path.join(pathUtils.getWorkspacePath()!, activeProject)), targetFilePath).replaceAll('\\', '/');
        quartus.addVhdlFileToProject(context, activeProject, quartusPath, relativePath);

        console.log('Finished creation of entity and added to active project as source file!');
        vscode.window.showInformationMessage('Finished creation of entity and added to active project as source file!');
        outputChannel.appendLine('Finished creation of entity and added to active project as source file!');
    });
} 