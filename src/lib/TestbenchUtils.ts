import { entityProperty } from './EntityUtils';

export function generateTestbenchComponent(genericProperties : entityProperty[] | null, portProperties: entityProperty[] | null) {
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

        componentContent += portProperties![portIndex].propertyName + ' : ' + portProperties![portIndex].propertyType;
    }

    componentContent += '\n);'

    return componentContent;
}