const fs = require("fs");
const path = require("path");
const minimist = require("minimist");

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

// Parse command line arguments using minimist
const args = minimist(process.argv.slice(2), {
	string: ["_", "output-file", "exclude", "format", "output-path", "extensions", "exclude-patterns", "tab", "branch", "last-branch", "ignore"],
	boolean: ["help", "version", "dir-only", "hidden", "size", "permissions", "modified", "subfolder", "verbose", "color"],
	alias: {
		h: "help",
		v: "version",
		d: "dir-only",
		o: "output-file",
	},
	default: {
		// _: ["."], // default input directory
		// format: "txt", // default format
		// "max-depth": 10,
		// "max-file-size": 10485760,
	},
});

// Show version and exit if --version flag is provided
if (args.version) {
	const packageJson = require("../package.json");
	console.log(`${packageJson.name}/${packageJson.version} ${process.platform}-${process.arch} node-${process.version}`);
	process.exit(0);
}

// Show help and exit if --help flag is provided
if (args.help) {
	console.log(`
Usage: node treeGenerator.js [options] [directory]

Options:
  -h, --help              Show this help message
  -v, --version           Show version information
  -d, --dir-only          Generate a directory-only tree diagram
  -o, --output-file       Save output to a file (default: directory-structure)
  --exclude               Comma-separated list of folders to exclude
  --format                Output format (txt, tree, json) (default: txt)
  --max-depth             Maximum directory depth to traverse (default: 10)
  --hidden                Show hidden files (default: false)
  --size                  Show file sizes (default: false)
  --permissions           Show file permissions (default: false)
  --modified              Show last modified dates (default: false)
  --extensions            Comma-separated list of file extensions to include
  --exclude-patterns      Comma-separated list of patterns to exclude
  --output-path           Path for output files (default: ./output)
  --subfolder             Create subfolder for output (default: false)
  --verbose               Show verbose output (default: false)
  --color                 Enable color output (default: false)
  --max-file-size         Maximum file size to include in bytes (default: 10485760)
  --tab                   String for indentation (default: │   )
  --branch                String for non-terminal items (default: ├── )
  --last-branch           String for terminal items (default: └── )
  --ignore                Additional files to ignore (default: .DS_Store,Thumbs.db)

Examples:
  node treeGenerator.js                    # Generate tree for current directory
  node treeGenerator.js /path/to/project   # Generate tree for specific directory
  node treeGenerator.js -d                 # Generate directory-only tree
  node treeGenerator.js -o mytree.txt      # Save output to specific file
  node treeGenerator.js --max-depth 5      # Limit tree depth to 5 levels
  node treeGenerator.js --size --hidden    # Show file sizes and hidden files
	`);
	process.exit(0);
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

// Constants with priority: CLI args > environment variables > config > default value
const OUTPUT_FILE = args["output-file"] || process.env.OUTPUT_FILE || config.OUTPUT_FILE || "directory-structure";
// Handle TAB specially to ensure proper spacing - check if env var has been truncated
let tabFromEnv = process.env.TAB;
// If TAB from env is truncated (doesn't have 4 characters with │ at start), restore proper format
if (tabFromEnv && (tabFromEnv.length !== 4 || !tabFromEnv.startsWith("│"))) {
	// If we detect truncation, use default instead
	tabFromEnv = undefined;
}
const TAB = args.tab || tabFromEnv || config.TAB || "│   "; // Vertical line with 3 spaces for proper tree structure

// Handle BRANCH specially to ensure proper spacing - check if env var has proper format
let branchFromEnv = process.env.BRANCH;
// If BRANCH from env doesn't have proper format (├── followed by space), use default
if (branchFromEnv && (branchFromEnv.length !== 5 || !branchFromEnv.startsWith("├──"))) {
	// If we detect truncation, use default instead
	branchFromEnv = undefined;
}
const BRANCH = args.branch || branchFromEnv || config.BRANCH || "├── "; // Branch character for non-last items

// Handle LAST_BRANCH specially to ensure proper spacing - check if env var has proper format
let lastBranchFromEnv = process.env.LAST_BRANCH;
// If LAST_BRANCH from env doesn't have proper format (└── followed by space), use default
if (lastBranchFromEnv && (lastBranchFromEnv.length !== 5 || !lastBranchFromEnv.startsWith("└──"))) {
	// If we detect truncation, use default instead
	lastBranchFromEnv = undefined;
}
const LAST_BRANCH = args["last-branch"] || lastBranchFromEnv || config.LAST_BRANCH || "└── "; // Branch character for last items

const MAX_DEPTH = args["max-depth"] || parseInt(process.env.MAX_DEPTH) || config.MAX_DEPTH || 10;
const SHOW_HIDDEN = args.hidden || (process.env.SHOW_HIDDEN ? process.env.SHOW_HIDDEN === "true" : config.SHOW_HIDDEN) || false;
const SHOW_SIZE = args.size || (process.env.SHOW_SIZE ? process.env.SHOW_SIZE === "true" : config.SHOW_SIZE) || false;
const SHOW_PERMISSIONS = args.permissions || (process.env.SHOW_PERMISSIONS ? process.env.SHOW_PERMISSIONS === "true" : config.SHOW_PERMISSIONS) || false;
const SHOW_LAST_MODIFIED = args.modified || (process.env.SHOW_LAST_MODIFIED ? process.env.SHOW_LAST_MODIFIED === "true" : config.SHOW_LAST_MODIFIED) || false;
const INCLUDE_EXTENSIONS = args.extensions || process.env.INCLUDE_EXTENSIONS || config.INCLUDE_EXTENSIONS || "";
const EXCLUDE_PATTERNS = args["exclude-patterns"] || process.env.EXCLUDE_PATTERNS || config.EXCLUDE_PATTERNS || "";
const OUTPUT_PATH = args["output-path"] || process.env.OUTPUT_PATH || config.OUTPUT_PATH || "./output";
const CREATE_SUBFOLDER = args.subfolder || (process.env.CREATE_SUBFOLDER ? process.env.CREATE_SUBFOLDER === "true" : config.CREATE_SUBFOLDER) || false;
const VERBOSE = args.verbose || (process.env.VERBOSE ? process.env.VERBOSE === "true" : config.VERBOSE) || false;
const COLOR_OUTPUT = args.color || (process.env.COLOR_OUTPUT ? process.env.COLOR_OUTPUT === "true" : config.COLOR_OUTPUT) || false;
const MAX_FILE_SIZE = args["max-file-size"] || parseInt(process.env.MAX_FILE_SIZE) || config.MAX_FILE_SIZE || 10485760; // 10MB default
const IGNORE_LIST = getArrayValue(args.ignore, process.env.IGNORE_LIST, config.IGNORE_LIST, ".DS_Store,Thumbs.db");

// Handle directory-only flag by setting file exclusion patterns
const DIR_ONLY_MODE = args["dir-only"];
const EXCLUDE_FILES = DIR_ONLY_MODE
	? ["*"]
	: // Exclude all files in directory-only mode
		getArrayValue(args.exclude, process.env.EXCLUDE_FILES, config.EXCLUDE_FILES, "Desktop.ini,*.tmp,*.log,*.bak,*.swp"); // Default excluded files

const EXCLUDE_FOLDERS = [...new Set([...getArrayValue(args.exclude, process.env.EXCLUDE_FOLDERS, config.EXCLUDE_FOLDERS, ".git,node_modules,dist,build"), ...IGNORE_LIST])]; // Default excluded folders
const INPUT_DIR = args._[0] || process.env.INPUT_DIR || config.INPUT_DIR || "."; // Use the first positional argument as input directory
const FORMAT = args.format || process.env.FORMAT || config.FORMAT || "txt"; // Can be 'txt', 'tree', or 'json'

if (VERBOSE === true && process.env.LOGGING === "true") {
	console.log("----");
	console.log("[ALL CONSTANTS:]");
	console.log("----");
	// console.log("✅ FORMAT=", FORMAT);
	// console.log("args.format=", args.format);
	// console.log("process.env.FORMAT=", process.env.FORMAT);
	// console.log("config.FORMAT=", config.FORMAT);
	console.log("----");
	console.log("✅ OUTPUT_FILE");
	console.log("OUTPUT_FILE=", OUTPUT_FILE);
	console.log("args.OUTPUT_FILE=", args.OUTPUT_FILE);
	console.log("process.env.OUTPUT_FILE=", process.env.OUTPUT_FILE);
	console.log("config.OUTPUT_FILE=", config.OUTPUT_FILE);
	console.log("----");
	console.log("✅ TAB");
	console.log("TAB=", TAB);
	console.log("args.TAB=", args.TAB);
	console.log("process.env.TAB=", process.env.TAB);
	console.log("config.TAB=", config.TAB);
	console.log("----");
	console.log("✅ BRANCH");
	console.log("BRANCH=", BRANCH);
	console.log("args.BRANCH=", args.BRANCH);
	console.log("process.env.BRANCH=", process.env.BRANCH);
	console.log("config.BRANCH=", config.BRANCH);
	console.log("----");
	console.log("✅ LAST_BRANCH");
	console.log("LAST_BRANCH=", LAST_BRANCH);
	console.log("args.LAST_BRANCH=", args.LAST_BRANCH);
	console.log("process.env.LAST_BRANCH=", process.env.LAST_BRANCH);
	console.log("config.LAST_BRANCH=", config.LAST_BRANCH);
	console.log("----");
	console.log("✅ EXCLUDE_FOLDERS");
	console.log("EXCLUDE_FOLDERS=", EXCLUDE_FOLDERS);
	console.log("args.EXCLUDE_FOLDERS=", args.EXCLUDE_FOLDERS);
	console.log("process.env.EXCLUDE_FOLDERS=", process.env.EXCLUDE_FOLDERS);
	console.log("config.EXCLUDE_FOLDERS=", config.EXCLUDE_FOLDERS);
	console.log("----");
	console.log("✅ EXCLUDE_FILES");
	console.log("EXCLUDE_FILES=", EXCLUDE_FILES);
	console.log("args.EXCLUDE_FILES=", args.EXCLUDE_FILES);
	console.log("process.env.EXCLUDE_FILES=", process.env.EXCLUDE_FILES);
	console.log("config.EXCLUDE_FILES=", config.EXCLUDE_FILES);
	console.log("----");
	console.log("✅ INPUT_DIR");
	console.log("INPUT_DIR=", INPUT_DIR);
	console.log("args.INPUT_DIR=", args.INPUT_DIR);
	console.log("process.env.INPUT_DIR=", process.env.INPUT_DIR);
	console.log("config.INPUT_DIR=", config.INPUT_DIR);
	console.log("----");
	console.log("✅ FORMAT");
	console.log("FORMAT=", FORMAT);
	console.log("args.format=", args.format);
	console.log("process.env.FORMAT=", process.env.FORMAT);
	console.log("config.FORMAT=", config.FORMAT);
	console.log("----");
	console.log("✅ MAX_DEPTH");
	console.log("MAX_DEPTH=", MAX_DEPTH);
	console.log("args.MAX_DEPTH=", args.MAX_DEPTH);
	console.log("process.env.MAX_DEPTH=", process.env.MAX_DEPTH);
	console.log("config.MAX_DEPTH=", config.MAX_DEPTH);
	console.log("----");
	console.log("✅ SHOW_HIDDEN");
	console.log("SHOW_HIDDEN=", SHOW_HIDDEN);
	console.log("args.SHOW_HIDDEN=", args.SHOW_HIDDEN);
	console.log("process.env.SHOW_HIDDEN=", process.env.SHOW_HIDDEN);
	console.log("config.SHOW_HIDDEN=", config.SHOW_HIDDEN);
	console.log("----");
	console.log("✅ SHOW_SIZE");
	console.log("SHOW_SIZE=", SHOW_SIZE);
	console.log("args.SHOW_SIZE=", args.SHOW_SIZE);
	console.log("process.env.SHOW_SIZE=", process.env.SHOW_SIZE);
	console.log("config.SHOW_SIZE=", config.SHOW_SIZE);
	console.log("----");
	console.log("✅ SHOW_PERMISSIONS");
	console.log("SHOW_PERMISSIONS=", SHOW_PERMISSIONS);
	console.log("args.SHOW_PERMISSIONS=", args.SHOW_PERMISSIONS);
	console.log("process.env.SHOW_PERMISSIONS=", process.env.SHOW_PERMISSIONS);
	console.log("config.SHOW_PERMISSIONS=", config.SHOW_PERMISSIONS);
	console.log("----");
	console.log("✅ SHOW_LAST_MODIFIED");
	console.log("SHOW_LAST_MODIFIED=", SHOW_LAST_MODIFIED);
	console.log("args.SHOW_LAST_MODIFIED=", args.SHOW_LAST_MODIFIED);
	console.log("process.env.SHOW_LAST_MODIFIED=", process.env.SHOW_LAST_MODIFIED);
	console.log("config.SHOW_LAST_MODIFIED=", config.SHOW_LAST_MODIFIED);
	console.log("----");
	console.log("✅ INCLUDE_EXTENSIONS");
	console.log("INCLUDE_EXTENSIONS=", INCLUDE_EXTENSIONS);
	console.log("args.INCLUDE_EXTENSIONS=", args.INCLUDE_EXTENSIONS);
	console.log("process.env.INCLUDE_EXTENSIONS=", process.env.INCLUDE_EXTENSIONS);
	console.log("config.INCLUDE_EXTENSIONS=", config.INCLUDE_EXTENSIONS);
	console.log("----");
	console.log("✅ EXCLUDE_PATTERNS");
	console.log("EXCLUDE_PATTERNS=", EXCLUDE_PATTERNS);
	console.log("args.EXCLUDE_PATTERNS=", args.EXCLUDE_PATTERNS);
	console.log("process.env.EXCLUDE_PATTERNS=", process.env.EXCLUDE_PATTERNS);
	console.log("config.EXCLUDE_PATTERNS=", config.EXCLUDE_PATTERNS);
	console.log("----");
	console.log("✅ OUTPUT_PATH");
	console.log("OUTPUT_PATH=", OUTPUT_PATH);
	console.log("args.OUTPUT_PATH=", args.OUTPUT_PATH);
	console.log("process.env.OUTPUT_PATH=", process.env.OUTPUT_PATH);
	console.log("config.OUTPUT_PATH=", config.OUTPUT_PATH);
	console.log("----");
	console.log("✅ CREATE_SUBFOLDER");
	console.log("CREATE_SUBFOLDER=", CREATE_SUBFOLDER);
	console.log("args.CREATE_SUBFOLDER=", args.CREATE_SUBFOLDER);
	console.log("process.env.CREATE_SUBFOLDER=", process.env.CREATE_SUBFOLDER);
	console.log("config.CREATE_SUBFOLDER=", config.CREATE_SUBFOLDER);
	console.log("----");
	console.log("✅ VERBOSE");
	console.log("VERBOSE=", VERBOSE);
	console.log("args.VERBOSE=", args.VERBOSE);
	console.log("process.env.VERBOSE=", process.env.VERBOSE);
	console.log("config.VERBOSE=", config.VERBOSE);
	console.log("----");
	console.log("✅ COLOR_OUTPUT");
	console.log("COLOR_OUTPUT=", COLOR_OUTPUT);
	console.log("args.COLOR_OUTPUT=", args.COLOR_OUTPUT);
	console.log("process.env.COLOR_OUTPUT=", process.env.COLOR_OUTPUT);
	console.log("config.COLOR_OUTPUT=", config.COLOR_OUTPUT);
	console.log("----");
	console.log("✅ MAX_FILE_SIZE");
	console.log("MAX_FILE_SIZE=", MAX_FILE_SIZE);
	console.log("args.MAX_FILE_SIZE=", args.MAX_FILE_SIZE);
	console.log("process.env.MAX_FILE_SIZE=", process.env.MAX_FILE_SIZE);
	console.log("config.MAX_FILE_SIZE=", config.MAX_FILE_SIZE);
	console.log("----");
	console.log("✅ IGNORE_LIST");
	console.log("IGNORE_LIST=", IGNORE_LIST);
	console.log("args.IGNORE_LIST=", args.IGNORE_LIST);
	console.log("process.env.IGNORE_LIST=", process.env.IGNORE_LIST);
	console.log("config.IGNORE_LIST=", config.IGNORE_LIST);
	console.log("----");
}

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
			if (!isExcludedFile(item, excludeFiles) && isIncludedExtension(item) && !matchesExcludePattern(itemPath)) {
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
	if (depth > MAX_DEPTH) return "";

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
			// Skip files if in directory-only mode
			if (DIR_ONLY_MODE) {
				continue;
			}

			// Apply all filters for files
			if (!isExcludedFile(item, excludeFiles) && isIncludedExtension(item) && !matchesExcludePattern(itemPath)) {
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
		let additionalInfo = "";
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
			// If this is not the last item, use vertical bar prefix; otherwise use spaces
			const subPrefix = isLast ? prefix + "" : prefix + TAB; // Use vertical bars for non-last items, spaces for last
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
	IGNORE_LIST,
};
