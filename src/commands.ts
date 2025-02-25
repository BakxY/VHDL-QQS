import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { entityProperty, getEntityContents, getPortContent, getGenericContent, getPortPropertiesFromContent, getGenericPropertiesFromContent } from './lib/EntityUtils';
import { generateTestbenchComponent, generateTestbenchSignals, generateSignalMapping } from './lib/TestbenchUtils';
import { getAllEntities } from './lib/TomlUtils'

const TOML_PATH: string = './vhdl_ls.toml';

export function createNewTestbench(context: vscode.ExtensionContext, entityName: string) {
    const allEntities = getAllEntities(TOML_PATH);

    if (!allEntities) {
        // Error message is printed in function
        return;
    }

    let pathToEntityFile: string = '';

    for (let entity in allEntities) {
        if (allEntities[entity].endsWith(entityName + '.vhd')) {
            pathToEntityFile = allEntities[entity].replaceAll('\\', '/');
            break;
        }
    }

    if (pathToEntityFile == '') {
        vscode.window.showErrorMessage('Selected expression is not defined as a entity in your project!');
        return;
    }

    const entityContent: string | undefined = getEntityContents(pathToEntityFile)?.replaceAll('\r', '');

    if (!entityContent) {
        // Error message is printed in function
        return;
    }

    const genericContent: string | null = getGenericContent(entityContent);
    const portContent: string | null = getPortContent(entityContent);

    if (!portContent) {
        // Error message is printed in function
        return;
    }

    const PATH_TO_TESTBENCH_TEMPLATE: string = path.join(context.extensionPath, 'res', 'testbench_template.vhd');

    let generatedTestbench: string = fs.readFileSync(PATH_TO_TESTBENCH_TEMPLATE, 'utf-8');

    generatedTestbench = generatedTestbench.replaceAll('TESTBENCH_ENTITY', entityName);
    generatedTestbench = generatedTestbench.replaceAll('DATE_CREATED', new Date().toLocaleDateString('de-CH'));

    const portProperties: entityProperty[] | null = getPortPropertiesFromContent(portContent);
    const genericProperties: entityProperty[] | null = getGenericPropertiesFromContent(genericContent);

    let componentContent = generateTestbenchComponent(genericProperties, portProperties);
    generatedTestbench = generatedTestbench.replaceAll('ENTITY_CONTENT', componentContent);

    let testbenchSignals = generateTestbenchSignals(portProperties);
    generatedTestbench = generatedTestbench.replaceAll('TESTBENCH_INTERNAL_SIGNALS', testbenchSignals);

    let testbenchSignalMapping = generateSignalMapping(portProperties);
    generatedTestbench = generatedTestbench.replaceAll('ENTITY_INTERAL_MAPPING', testbenchSignalMapping);

    fs.writeFileSync(pathToEntityFile.replace('.vhd', '_tb.vhd'), generatedTestbench);
}