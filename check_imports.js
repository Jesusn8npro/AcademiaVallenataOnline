
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, 'src');

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });

    return arrayOfFiles;
}

const files = getAllFiles(projectRoot);
let errorsFound = 0;

console.log('Checking imports for case sensitivity issues...');

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const dir = path.dirname(file);

    lines.forEach((line, index) => {
        // Basic regex to capture imports like: import ... from './file.css' or import './file.css'
        const match = line.match(/import\s+(?:.*from\s+)?['"](\..*?)['"]/);
        if (match) {
            const importPath = match[1];
            // Resolve path
            try {
                const absoluteImportPath = path.resolve(dir, importPath);
                const importDir = path.dirname(absoluteImportPath);
                const importFileName = path.basename(absoluteImportPath);

                if (fs.existsSync(absoluteImportPath)) { // Check if file exists (case-insensitive on Windows)
                    // Now check strict casing
                    const actualFiles = fs.readdirSync(importDir);
                    if (!actualFiles.includes(importFileName)) {
                        const actualFile = actualFiles.find(f => f.toLowerCase() === importFileName.toLowerCase());
                        if (actualFile) {
                            console.log(`[MISMATCH] File: ${path.relative(projectRoot, file)}:${index + 1}`);
                            console.log(`  Imported: ${importFileName}`);
                            console.log(`  Actual:   ${actualFile}`);
                            errorsFound++;
                        }
                    }
                }
            } catch (e) {
                // Ignore resolution errors for now, focus on existing files
            }
        }
    });
});

if (errorsFound === 0) {
    console.log('No case sensitivity mismatches found!');
} else {
    console.log(`Found ${errorsFound} mismatches.`);
}
