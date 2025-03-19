import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as entityUtils from './EntityUtils';
import * as testbenchUtils from './TestbenchUtils';
import * as tomlUtils from './TomlUtils';
import * as pathUtils from './PathUtils';
import { outputChannel } from '../extension';

/**
 * @brief Runs all support function that are needed to create a new testbench for a provided entity and writes that testbench to the file system
 * 
 * @param context Context from where the command was ran
 * @param entityName Name of the entity that the testbench should be generated for
 */
export function createNewTestbench(context: vscode.ExtensionContext, entityName: string, pathToEntityFile: string): void {
    // Get content of entity definition
    const entityContent: string | undefined = entityUtils.getEntityContents(pathToEntityFile)?.replaceAll('\r', '');
    if (entityContent === undefined) { return; }

    // Separate generic definitions for the rest
    const genericContent: string | null = entityUtils.getGenericContent(entityContent);

    // Separate generic definitions for the rest
    const portContent: string | null = entityUtils.getPortContent(entityContent);
    if (portContent === null) { return; }

    // Generate entire path for template file
    const PATH_TO_TESTBENCH_TEMPLATE: string = path.join(context.extensionPath, 'res', 'testbench_template.vhd');
    console.log('Loading template file from "' + PATH_TO_TESTBENCH_TEMPLATE + '"');
    outputChannel.append('Loading template file from "' + PATH_TO_TESTBENCH_TEMPLATE + '"');

    let generatedTestbench: string = fs.readFileSync(PATH_TO_TESTBENCH_TEMPLATE, 'utf-8');

    // Fill in template file
    generatedTestbench = generatedTestbench.replaceAll('TESTBENCH_ENTITY', entityName);
    generatedTestbench = generatedTestbench.replaceAll('DATE_CREATED', new Date().toLocaleDateString('de-CH'));

    const portProperties: entityUtils.entityProperty[] | null = entityUtils.getPortPropertiesFromContent(portContent);
    const genericProperties: entityUtils.entityProperty[] | null = entityUtils.getGenericPropertiesFromContent(genericContent);

    const componentContent = testbenchUtils.generateTestbenchComponent(genericProperties, portProperties);
    generatedTestbench = generatedTestbench.replaceAll('ENTITY_CONTENT', componentContent);

    const testbenchSignals = testbenchUtils.generateTestbenchSignals(portProperties);
    generatedTestbench = generatedTestbench.replaceAll('TESTBENCH_INTERNAL_SIGNALS', testbenchSignals);

    const testbenchSignalMapping = testbenchUtils.generateSignalMapping(portProperties);
    generatedTestbench = generatedTestbench.replaceAll('ENTITY_INTERAL_MAPPING', testbenchSignalMapping);

    // Check if new template file exists already
    if (fs.existsSync(pathToEntityFile.replace('.vhd', '_tb.vhd'))) {
        vscode.window.showErrorMessage('File "' + pathToEntityFile.replace('.vhd', '_tb.vhd') + '" already exits!');
        console.error('File "' + pathToEntityFile.replace('.vhd', '_tb.vhd') + '" already exits!');
        outputChannel.append('File "' + pathToEntityFile.replace('.vhd', '_tb.vhd') + '" already exits!');
        return;
    }

    // Write template to fs
    console.log('Writing testbench to "' + pathToEntityFile.replace('.vhd', '_tb.vhd') + '"');
    outputChannel.append('Writing testbench to "' + pathToEntityFile.replace('.vhd', '_tb.vhd') + '"');
    fs.writeFileSync(pathToEntityFile.replace('.vhd', '_tb.vhd'), generatedTestbench);
}