import * as fs from 'fs';
import * as path from 'path'

export function resolvePathWithWildcards(pattern: string, baseDir: string = process.cwd()): string[] {
    const parts = pattern.split(path.sep);
    const results: string[] = [];

    function recursiveResolve(dir: string, remainingParts: string[]): void {
        if (remainingParts.length === 0) {
            if (fs.existsSync(dir)) {
                results.push(path.normalize(dir));
            }
            return;
        }

        const currentPart = remainingParts[0];
        const restParts = remainingParts.slice(1);

        if (currentPart === '**') {
            if (remainingParts.length === 1 && remainingParts[0] === '**') {
                recursiveResolve(dir, []);
            }
            recursiveResolve(dir, restParts);
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    recursiveResolve(path.join(dir, entry.name), remainingParts);
                }
            }
        } else if (currentPart === '*') {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.name.match(new RegExp(`^${currentPart.replace(/\*/g, '.*')}$`))) {
                    recursiveResolve(path.join(dir, entry.name), restParts);
                }
            }
        } else if (currentPart.includes('*')) { //Handle patterns like *.vhd
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            const regex = new RegExp(`^${currentPart.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`); //escape . for regex
            for (const entry of entries) {
                if (entry.name.match(regex)) {
                    recursiveResolve(path.join(dir, entry.name), restParts);
                }
            }
        } else {
            const nextDir = path.join(dir, currentPart);
            if (fs.existsSync(nextDir)) {
                recursiveResolve(nextDir, restParts);
            }
        }
    }

    recursiveResolve(baseDir, parts);
    return results;
}