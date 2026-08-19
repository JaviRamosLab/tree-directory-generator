const fs = require('fs');
const path = require('path');
// Note: minimatch needs to be installed via npm install minimatch
try {
    var minimatch = require('minimatch');
} catch (e) {
    console.error('Please install minimatch package: npm install minimatch');
    process.exit(1);
}

// Constants
const OUTPUT_FILE = 'directory-structure';
const TAB = '│   ';
const BRANCH = '├── ';
const EXCLUDE_FOLDERS = ['.git', 'node_modules', 'dist', 'build']; // Default excluded folders
const EXCLUDE_FILES = ['Desktop.ini', '*.tmp', '*.log', '*.bak', '*.swp']; // Default excluded files
const INPUT_DIR = process.argv[2] || '.';
const FORMAT = process.argv[3] || 'txt'; // Can be 'txt', 'tree', or 'json'

let folderCount = 0;
let fileCount = 0;

/**
 * Check if a file should be excluded based on patterns
 */
function isExcludedFile(fileName, excludeFiles) {
    return excludeFiles.some(pattern => minimatch(fileName, pattern));
}

/**
 * Check if a folder should be excluded
 */
function isExcludedFolder(folderName, excludeFolders) {
    return excludeFolders.includes(folderName);
}

/**
 * Count folders and files without generating output
 */
function countItems(folderPath, excludeFolders, excludeFiles = EXCLUDE_FILES) {
    let folderCount = 0;
    let fileCount = 0;
    
    const items = fs.readdirSync(folderPath);
    
    for (const item of items) {
        const itemPath = path.join(folderPath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
            if (!isExcludedFolder(item, excludeFolders)) {
                folderCount++; // Count this folder
                const childCounts = countItems(itemPath, excludeFolders, excludeFiles);
                folderCount += childCounts.folderCount;
                fileCount += childCounts.fileCount;
            }
        } else {
            if (!isExcludedFile(item, excludeFiles)) {
                fileCount++;
            }
        }
    }
    
    return { folderCount, fileCount };
}

/**
 * Process a folder and its contents recursively to generate output
 * Folders first, then files
 */
function processFolder(folderPath, prefix, excludeFolders, excludeFiles = EXCLUDE_FILES, isRoot = false) {
    let result = '';
    
    // Read the contents of the folder
    const items = fs.readdirSync(folderPath);
    
    let files = [];
    let subFolders = [];
    
    // Separate files and folders
    for (const item of items) {
        const itemPath = path.join(folderPath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
            if (!isExcludedFolder(item, excludeFolders)) {
                subFolders.push(item);
            }
        } else {
            if (!isExcludedFile(item, excludeFiles)) {
                files.push(item);
            }
        }
    }
    
    // Process subfolders first
    for (let i = 0; i < subFolders.length; i++) {
        const subFolder = subFolders[i];
        const subFolderPath = path.join(folderPath, subFolder);
        result += `${prefix}${BRANCH}${subFolder}\n`;
        result += processFolder(subFolderPath, prefix + TAB, excludeFolders, excludeFiles, false);
    }
    
    // Then add files to the result
    for (const file of files) {
        result += `${prefix}${BRANCH}${file}\n`;
    }
    
    return result;
}

/**
 * Generate the tree structure in TXT format
 */
function generateTxtStructure(rootDir, excludeFolders, excludeFiles = EXCLUDE_FILES) {
    // Count items first
    const counts = countItems(rootDir, excludeFolders, excludeFiles);
    const folderCount = counts.folderCount;
    const fileCount = counts.fileCount;
    
    let result = '';
    result += '==========================================================\n';
    result += 'Directory Tree Generator\n';
    result += '==========================================================\n';
    result += `Directory structure generated on ${new Date().toString()}\n`;
    result += `Total number of folders: ${folderCount}\n`;
    result += `Total number of files: ${fileCount}\n`;
    result += '==========================================================\n\n';
    
    // Add root folder name at the top
    const rootFolderName = path.basename(rootDir);
    result += `${rootFolderName}\n`;
    
    result += processFolder(rootDir, '', excludeFolders, excludeFiles, true);
    
    return result;
}

/**
 * Generate the tree structure in JSON format
 */
function generateJsonStructure(folderPath, excludeFolders, excludeFiles = EXCLUDE_FILES, isRoot = false) {
    const folderName = path.basename(folderPath);
    const stat = fs.statSync(folderPath);
    
    if (!stat.isDirectory()) {
        return { name: folderName, type: 'file' };
    }
    
    const items = fs.readdirSync(folderPath);
    const structure = {
        name: folderName,
        type: 'folder',
        children: []
    };
    
    // Separate files and folders to put folders first
    const folders = [];
    const files = [];
    
    for (const item of items) {
        const itemPath = path.join(folderPath, item);
        const itemStat = fs.statSync(itemPath);
        
        if (itemStat.isDirectory()) {
            if (!isExcludedFolder(item, excludeFolders)) {
                folders.push(item);
            }
        } else {
            if (!isExcludedFile(item, excludeFiles)) {
                files.push(item);
            }
        }
    }
    
    // Add folders first
    for (const folder of folders) {
        const subFolderPath = path.join(folderPath, folder);
        structure.children.push(generateJsonStructure(subFolderPath, excludeFolders, excludeFiles));
    }
    
    // Then add files
    for (const file of files) {
        structure.children.push({
            name: file,
            type: 'file'
        });
    }
    
    return structure;
}

/**
 * Format output based on the specified format
 */
function formatOutput(rootDir, format, excludeFolders, excludeFiles = EXCLUDE_FILES) {
    switch (format.toLowerCase()) {
        case 'json':
            const jsonStructure = generateJsonStructure(rootDir, excludeFolders, excludeFiles, true);
            return JSON.stringify(jsonStructure, null, 2);
            
        case 'tree':
        case 'txt':
        default:
            return generateTxtStructure(rootDir, excludeFolders, excludeFiles);
    }
}

/**
 * Main function to run the tree generator
 */
function main() {
    let rootDir = INPUT_DIR;
    
    // If rootDir is '.', resolve to the actual current working directory name
    if (rootDir === '.') {
        rootDir = process.cwd();
    } else if (rootDir === '..') {
        rootDir = path.dirname(process.cwd());
    }
    
    // Validate input directory
    if (!fs.existsSync(rootDir)) {
        console.error('Directory does not exist.');
        process.exit(1);
    }
    
    // Get exclude folders from command line or use defaults
    let excludeFolders = EXCLUDE_FOLDERS;
    if (process.argv[4]) {
        excludeFolders = process.argv[4].split(',').map(f => f.trim());
    }
    
    // Get exclude files from command line or use defaults
    let excludeFiles = EXCLUDE_FILES;
    if (process.argv[5]) {
        excludeFiles = process.argv[5].split(',').map(f => f.trim());
    }
    
    // Generate the output based on the specified format
    const output = formatOutput(rootDir, FORMAT, excludeFolders, excludeFiles);
    
    // Determine the output file name based on format
    let fileName = OUTPUT_FILE;
    if (!fileName.endsWith(`.${FORMAT}`)) {
        fileName += `.${FORMAT}`;
    }
    
    // Write the output to the file
    fs.writeFileSync(fileName, output);
    console.log(`Directory structure saved to ${fileName}`);
    
    // Count items for display purposes
    const counts = countItems(rootDir, excludeFolders, excludeFiles);
    console.log(`Total number of folders: ${counts.folderCount}`);
    console.log(`Total number of files: ${counts.fileCount}`);
}

// Run the main function if this script is called directly
if (require.main === module) {
    main();
}

module.exports = {
    processFolder,
    generateTxtStructure,
    generateJsonStructure,
    formatOutput,
    OUTPUT_FILE,
    TAB,
    BRANCH,
    EXCLUDE_FOLDERS,
    EXCLUDE_FILES,
    INPUT_DIR,
    FORMAT
};