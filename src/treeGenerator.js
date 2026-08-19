const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config();

// Load configuration from config.js
let config;
try {
	config = require("../config/config.js");
} catch (error) {
	console.error("Config file not found. Using default values.");
	console.error(error);
	config = {};
}

// Note: minimatch needs to be installed via npm install minimatch
let minimatch;
try {
	minimatch = require("minimatch");
} catch (error) {
	console.error("Please install minimatch package: npm install minimatch");
	console.error(error);
	process.exit(1);
}

// Helper function to split and clean arrays
function getArrayValue(argValue, envValue, configValue, defaultValue) {
	// Priority: command line arg > environment variable > config > default
	if (argValue) {
		return argValue.split(",").map((item) => item.trim());
	} else if (envValue) {
		return envValue.split(",").map((item) => item.trim());
	} else if (configValue) {
		return configValue.split(",").map((item) => item.trim());
	} else {
		return Array.isArray(defaultValue) ? defaultValue : defaultValue.split(",").map((item) => item.trim());
	}
}

/**
 * Check if a file should be excluded based on patterns
 */
function isExcludedFile(fileName, excludeFiles) {
	return excludeFiles.some((pattern) => minimatch(fileName, pattern));
}

/**
 * Check if a folder should be excluded
 */
function isExcludedFolder(folderName, excludeFolders) {
	return excludeFolders.includes(folderName);
}

/**
 * Check if a file is hidden
 */
function isHiddenFile(fileName) {
	return fileName.startsWith(".");
}

/**
 * Check if file extension should be included
 */
function isIncludedExtension(fileName) {
	if (!INCLUDE_EXTENSIONS) return true;
	const ext = path.extname(fileName).substring(1); // Remove the dot
	const allowedExtensions = INCLUDE_EXTENSIONS.split(",");
	return allowedExtensions.includes(ext);
}

/**
 * Check if file matches exclusion pattern
 */
function matchesExcludePattern(filePath) {
	if (!EXCLUDE_PATTERNS) return false;
	const patterns = EXCLUDE_PATTERNS.split(",");
	return patterns.some((pattern) => minimatch(filePath, pattern));
}

/**
 * Get file size in human-readable format
 */
function getFileSize(filePath) {
	const stats = fs.statSync(filePath);
	return stats.size;
}

/**
 * Get file permissions in human-readable format
 */
function getFilePermissions(filePath) {
	const stats = fs.statSync(filePath);
	return stats.mode.toString(8).slice(-3);
}

/**
 * Get formatted last modified date
 */
function getLastModified(filePath) {
	const stats = fs.statSync(filePath);
	return stats.mtime.toLocaleDateString();
}

// Constants with priority: process.argv[#] > process.env.* > config.* > default value
const OUTPUT_FILE = process.argv[6] || process.env.OUTPUT_FILE || config.OUTPUT_FILE || "directory-structure";
const TAB = "│   "; // Vertical line with 3 spaces for proper tree structure
const BRANCH = "├── "; // Branch character for non-last items
const LAST_BRANCH = "└── "; // Branch character for last items
const MAX_DEPTH = parseInt(process.argv[10]) || parseInt(process.env.MAX_DEPTH) || config.MAX_DEPTH || 10;
const SHOW_HIDDEN = (process.argv[11] ? process.argv[11] === "true" : process.env.SHOW_HIDDEN ? process.env.SHOW_HIDDEN === "true" : config.SHOW_HIDDEN) || false;
const SHOW_SIZE = (process.argv[12] ? process.argv[12] === "true" : process.env.SHOW_SIZE ? process.env.SHOW_SIZE === "true" : config.SHOW_SIZE) || false;
const SHOW_PERMISSIONS = (process.argv[13] ? process.argv[13] === "true" : process.env.SHOW_PERMISSIONS ? process.env.SHOW_PERMISSIONS === "true" : config.SHOW_PERMISSIONS) || false;
const SHOW_LAST_MODIFIED = (process.argv[14] ? process.argv[14] === "true" : process.env.SHOW_LAST_MODIFIED ? process.env.SHOW_LAST_MODIFIED === "true" : config.SHOW_LAST_MODIFIED) || false;
const INCLUDE_EXTENSIONS = process.argv[15] || process.env.INCLUDE_EXTENSIONS || config.INCLUDE_EXTENSIONS || "";
const EXCLUDE_PATTERNS = process.argv[16] || process.env.EXCLUDE_PATTERNS || config.EXCLUDE_PATTERNS || "";
const OUTPUT_PATH = process.argv[17] || process.env.OUTPUT_PATH || config.OUTPUT_PATH || "./output";
const CREATE_SUBFOLDER = (process.argv[18] ? process.argv[18] === "true" : process.env.CREATE_SUBFOLDER ? process.env.CREATE_SUBFOLDER === "true" : config.CREATE_SUBFOLDER) || false;
const VERBOSE = (process.argv[19] ? process.argv[19] === "true" : process.env.VERBOSE ? process.env.VERBOSE === "true" : config.VERBOSE) || false;
const COLOR_OUTPUT = (process.argv[20] ? process.argv[20] === "true" : process.env.COLOR_OUTPUT ? process.env.COLOR_OUTPUT === "true" : config.COLOR_OUTPUT) || false;
const MAX_FILE_SIZE = parseInt(process.argv[21]) || parseInt(process.env.MAX_FILE_SIZE) || config.MAX_FILE_SIZE || 10485760; // 10MB default
const IGNORE_LIST = getArrayValue(process.argv[22], process.env.IGNORE_LIST, config.IGNORE_LIST, ".DS_Store,Thumbs.db");

const EXCLUDE_FOLDERS = [...new Set([...getArrayValue(process.argv[4], process.env.EXCLUDE_FOLDERS, config.EXCLUDE_FOLDERS, ".git,node_modules,dist,build"), ...IGNORE_LIST])]; // Default excluded folders
const EXCLUDE_FILES = getArrayValue(process.argv[5], process.env.EXCLUDE_FILES, config.EXCLUDE_FILES, "Desktop.ini,*.tmp,*.log,*.bak,*.swp"); // Default excluded files
const INPUT_DIR = process.argv[2] || process.env.INPUT_DIR || config.INPUT_DIR || ".";
const FORMAT = process.argv[3] || process.env.FORMAT || config.FORMAT || "txt"; // Can be 'txt', 'tree', or 'json'

/**
 * Count folders and files without generating output
 */
function countItems(folderPath, excludeFolders, excludeFiles = EXCLUDE_FILES, depth = 0) {
	if (depth > MAX_DEPTH) return { folderCount: 0, fileCount: 0 };

	let folderCount = 0;
	let fileCount = 0;

	const items = fs.readdirSync(folderPath);

	for (const item of items) {
		// Skip hidden files if SHOW_HIDDEN is false
		if (!SHOW_HIDDEN && isHiddenFile(item)) {
			continue;
		}

		const itemPath = path.join(folderPath, item);
		const stat = fs.statSync(itemPath);

		if (stat.isDirectory()) {
			if (!isExcludedFolder(item, excludeFolders)) {
				folderCount++; // Count this folder
				const childCounts = countItems(itemPath, excludeFolders, excludeFiles, depth + 1);
				folderCount += childCounts.folderCount;
				fileCount += childCounts.fileCount;
			}
		} else {
			// Apply all filters for files
			if (!isExcludedFile(item, excludeFiles) && 
				isIncludedExtension(item) && 
				!matchesExcludePattern(itemPath)) {
				
				// Check file size if MAX_FILE_SIZE is set
				if (MAX_FILE_SIZE > 0) {
					const fileSize = getFileSize(itemPath);
					if (fileSize <= MAX_FILE_SIZE) {
						fileCount++;
					}
				} else {
					fileCount++;
				}
			}
		}
	}

	return { folderCount, fileCount };
}

/**
 * Process a folder and its contents recursively to generate output
 * Folders first, then files
 */
function processFolder(folderPath, prefix, excludeFolders, excludeFiles = EXCLUDE_FILES, isRoot = false, depth = 0) {
	if (depth > MAX_DEPTH) return '';

	let result = "";

	// Read the contents of the folder
	const items = fs.readdirSync(folderPath);

	let files = [];
	let subFolders = [];

	// Separate files and folders
	for (const item of items) {
		// Skip hidden files if SHOW_HIDDEN is false
		if (!SHOW_HIDDEN && isHiddenFile(item)) {
			continue;
		}

		const itemPath = path.join(folderPath, item);
		const stat = fs.statSync(itemPath);

		if (stat.isDirectory()) {
			if (!isExcludedFolder(item, excludeFolders)) {
				subFolders.push(item);
			}
		} else {
			// Apply all filters for files
			if (!isExcludedFile(item, excludeFiles) && 
				isIncludedExtension(item) && 
				!matchesExcludePattern(itemPath)) {
				
				// Check file size if MAX_FILE_SIZE is set
				if (MAX_FILE_SIZE > 0) {
					const fileSize = getFileSize(itemPath);
					if (fileSize <= MAX_FILE_SIZE) {
						files.push(item);
					}
				} else {
					files.push(item);
				}
			}
		}
	}

	// Combine folders and files, with folders first
	const allItems = [...subFolders, ...files];

	// Process all items
	for (let i = 0; i < allItems.length; i++) {
		const item = allItems[i];
		const isLast = i === allItems.length - 1;
		const itemPath = path.join(folderPath, item);
		const stat = fs.statSync(itemPath);

		// Determine if this is the last item to use the appropriate branch character
		const branchChar = isLast ? LAST_BRANCH : BRANCH;

		// Prepare additional information based on configuration settings
		let additionalInfo = '';
		if (stat.isFile()) {
			if (SHOW_SIZE) {
				const size = getFileSize(itemPath);
				additionalInfo += ` [${size} bytes]`;
			}
			if (SHOW_PERMISSIONS) {
				const perms = getFilePermissions(itemPath);
				additionalInfo += ` [${perms}]`;
			}
			if (SHOW_LAST_MODIFIED) {
				const modDate = getLastModified(itemPath);
				additionalInfo += ` [${modDate}]`;
			}
		}

		if (stat.isDirectory()) {
			// Process subfolder
			result += `${prefix}${branchChar}${item}${additionalInfo}\n`;
			// For subfolder content, adjust prefix appropriately
			// Use vertical line continuation for non-last items, and spaces for last items
			const subPrefix = isLast ? prefix + "    " : prefix + TAB; // Use spaces instead of │   for last item
			result += processFolder(itemPath, subPrefix, excludeFolders, excludeFiles, false, depth + 1);
		} else {
			// Process file
			result += `${prefix}${branchChar}${item}${additionalInfo}\n`;
		}
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

	let result = "";
	result += "==========================================================\n";
	result += "Directory Tree Generator\n";
	result += "==========================================================\n";
	result += `Directory structure generated on ${new Date().toString()}\n`;
	result += `Total number of folders: ${folderCount}\n`;
	result += `Total number of files: ${fileCount}\n`;
	result += "==========================================================\n\n";

	// Add root folder name at the top
	const rootFolderName = path.basename(rootDir);
	result += `${rootFolderName}\n`;

	result += processFolder(rootDir, "", excludeFolders, excludeFiles, true);

	return result;
}

/**
 * Generate the tree structure in JSON format
 */
function generateJsonStructure(folderPath, excludeFolders, excludeFiles = EXCLUDE_FILES, isRoot = false) {
	const folderName = path.basename(folderPath);
	const stat = fs.statSync(folderPath);

	if (!stat.isDirectory()) {
		return { name: folderName, type: "file" };
	}

	const items = fs.readdirSync(folderPath);
	const structure = {
		name: folderName,
		type: "folder",
		children: [],
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
			type: "file",
		});
	}

	return structure;
}

/**
 * Format output based on the specified format
 */
function formatOutput(rootDir, format, excludeFolders, excludeFiles = EXCLUDE_FILES) {
	switch (format.toLowerCase()) {
		case "json": {
			const jsonStructure = generateJsonStructure(rootDir, excludeFolders, excludeFiles, true);
			return JSON.stringify(jsonStructure, null, 2);
		}

		case "tree":
		case "txt":
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
	if (rootDir === ".") {
		rootDir = process.cwd();
	} else if (rootDir === "..") {
		rootDir = path.dirname(process.cwd());
	}

	// Validate input directory
	if (!fs.existsSync(rootDir)) {
		console.error("Directory does not exist.");
		process.exit(1);
	}

	// Since we've already processed the configuration hierarchy in constants,
	// we can use the resolved values directly
	const excludeFolders = EXCLUDE_FOLDERS;
	const excludeFiles = EXCLUDE_FILES;

	// Generate the output based on the specified format
	const output = formatOutput(rootDir, FORMAT, excludeFolders, excludeFiles);

	// Determine the output file name based on format
	let fileName = OUTPUT_FILE;
	if (!fileName.endsWith(`.${FORMAT}`)) {
		fileName += `.${FORMAT}`;
	}

	// Create output directory if needed
	if (CREATE_SUBFOLDER) {
		if (!fs.existsSync(OUTPUT_PATH)) {
			fs.mkdirSync(OUTPUT_PATH, { recursive: true });
		}
		fileName = path.join(OUTPUT_PATH, fileName);
	}

	// Write the output to the file
	fs.writeFileSync(fileName, output);
	console.log(`Directory structure saved to ${fileName}`);

	// Count items for display purposes
	const counts = countItems(rootDir, excludeFolders, excludeFiles);
	console.log(`Total number of folders: ${counts.folderCount}`);
	console.log(`Total number of files: ${counts.fileCount}`);

	if (VERBOSE) {
		console.log(`Max depth: ${MAX_DEPTH}`);
		console.log(`Show hidden files: ${SHOW_HIDDEN}`);
		console.log(`Show file sizes: ${SHOW_SIZE}`);
		console.log(`Show permissions: ${SHOW_PERMISSIONS}`);
		console.log(`Show last modified: ${SHOW_LAST_MODIFIED}`);
		console.log(`Include extensions: ${INCLUDE_EXTENSIONS}`);
		console.log(`Exclude patterns: ${EXCLUDE_PATTERNS}`);
		console.log(`Max file size: ${MAX_FILE_SIZE} bytes`);
	}
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
	LAST_BRANCH,
	EXCLUDE_FOLDERS,
	EXCLUDE_FILES,
	INPUT_DIR,
	FORMAT,
	MAX_DEPTH,
	SHOW_HIDDEN,
	SHOW_SIZE,
	SHOW_PERMISSIONS,
	SHOW_LAST_MODIFIED,
	INCLUDE_EXTENSIONS,
	EXCLUDE_PATTERNS,
	OUTPUT_PATH,
	CREATE_SUBFOLDER,
	VERBOSE,
	COLOR_OUTPUT,
	MAX_FILE_SIZE,
	IGNORE_LIST
};