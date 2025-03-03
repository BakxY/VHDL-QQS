import * as entityUtils from './EntityUtils';

/**
 * @brief Generates the testbench component string to apply to the testbench template
 * 
 * @param genericProperties Array containing all generic properties of the original entity
 * @param portProperties Array containing all port properties of the original entity
 * 
 * @returns The component content to apply to the testbench template
 */
export function generateTestbenchComponent(genericProperties: entityUtils.entityProperty[] | null, portProperties: entityUtils.entityProperty[] | null) {
    let componentContent = '';

    if (genericProperties) {
        componentContent += 'generic (\n';

        for (let genericIndex = 0; genericIndex < genericProperties.length; genericIndex++) {
            if (genericIndex > 0) {
                componentContent += ';\n';
            }

            componentContent += genericProperties[genericIndex].propertyName + ' : ' + genericProperties[genericIndex].propertyType;
        }

        componentContent += '\n);\n'
    }

    componentContent += 'port (\n';

    for (let portIndex = 0; portIndex < portProperties!.length; portIndex++) {
        if (portIndex > 0) {
            componentContent += ';\n';
        }

        componentContent += portProperties![portIndex].propertyName + ' : ' + portProperties![portIndex].propertySignalDir + ' ' + portProperties![portIndex].propertyType;
    }

    componentContent += '\n);'

    return componentContent;
}

/**
 * @brief Generates the testbench internal signals to apply to the testbench template
 * 
 * @param portProperties Array containing all port properties of the original entity
 * 
 * @returns The generated testbench signals as a string
 */
export function generateTestbenchSignals(portProperties: entityUtils.entityProperty[] | null) {
    let testbenchSignals = '';

    for (let signalIndex = 0; signalIndex < portProperties!.length; signalIndex++) {

        testbenchSignals += 'signal ' + portProperties![signalIndex].propertyName + ' : ' + portProperties![signalIndex].propertyType + ';\n';
    }

    return testbenchSignals;
}

/**
 * @brief Generates the testbench internal signal mapping to the entity
 * 
 * @param portProperties Array containing all port properties of the original entity
 * 
 * @returns The generated testbench signal mapping
 */
export function generateSignalMapping(portProperties: entityUtils.entityProperty[] | null) {
    let testbenchSignals = '';

    for (let signalIndex = 0; signalIndex < portProperties!.length; signalIndex++) {
        if (signalIndex > 0) {
            testbenchSignals += ',\n';
        }

        testbenchSignals += portProperties![signalIndex].propertyName + ' => ' + portProperties![signalIndex].propertyName
    }

    return testbenchSignals;
}