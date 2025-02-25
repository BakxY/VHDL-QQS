import * as path from 'path'
import * as fs from 'fs';
import { resolvePathWithWildcards } from './PathUtils';

export function getAllProjectFiles() {
    const allFiles: string[] = resolvePathWithWildcards(path.normalize('**/*'));
    let allProjectFiles: string[] = [];

    for (let fileIndex = 0; fileIndex < allFiles.length; fileIndex++) {
        if (path.extname(allFiles[fileIndex]) == '.qpf') {
            allProjectFiles.push(allFiles[fileIndex].replace(process.cwd(), '').replaceAll('\\', '/'));
        }
    }

    return allProjectFiles;
}

export function checkForQuartusInstallation(pathToQuartus: string) {
    if (!fs.existsSync(pathToQuartus)) {
        return false;
    }

    const allQuartusFiles: string[] = fs.readdirSync(pathToQuartus);

    if (process.platform == 'win32') {
        if (!allQuartusFiles.includes('quartus_sh.exe')) {
            return false;
        }

        if (!allQuartusFiles.includes('quartus_pgmw.exe')) {
            return false;
        }
    }
    else {
        if (!allQuartusFiles.includes('quartus_sh')) {
            return false;
        }

        if (!allQuartusFiles.includes('quartus_pgmw')) {
            return false;
        }
    }

    return true;
}