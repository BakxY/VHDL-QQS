import * as path from 'path'
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