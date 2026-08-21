#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const minimist = require("minimist");
const packageJson = require("../package.json");

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

// Try to load gitignore-parser to handle .gitignore files
let gitignoreParser;
try {
	gitignoreParser = require("gitignore-parser");
} catch (error) {
	console.warn("gitignore-parser not found. Install with: npm install gitignore-parser");
	console.warn("Will not respect .gitignore rules.");
	gitignoreParser = null;
}

// Temporarily check if headers-related flags are in raw arguments
const rawArgs = process.argv.slice(2);
const headersFlagProvided = rawArgs.some(arg => 
	arg === '--headers' || 
	arg === '--no-headers' ||
	/^--headers($|=)/.test(arg) // matches --headers or --headers=value
);

// Parse command line arguments using minimist
const args = minimist(process.argv.slice(2), {
	string: ["_", "output-file", "exclude", "format", "output-path", "extensions", "exclude-patterns", "tab", "branch", "last-branch", "ignore"],
	boolean: ["help", "version", "dir-only", "hidden", "size", "permissions", "modified", "subfolder", "verbose", "color", "use-emojis", "gitignore", "headers"],
	alias: {
		h: "help",
		v: "version",
		d: "dir-only",
		o: "output-file",
		e: "use-emojis",
		g: "gitignore",
	},
	default: {
		// _: ["."], // default input directory
		// format: "txt", // default format
		// "max-depth": 10,
		// "max-file-size": 10485760,
	},
});

// Handle HEADERS with proper priority: CLI args > environment variables > config > default
// If headers flag was provided in CLI, use the parsed value
// Otherwise, check environment variables, then config, then default
const HEADERS = headersFlagProvided ? Boolean(args.headers) :
               process.env.HEADERS !== undefined ? process.env.HEADERS === "true" :
               config.HEADERS !== undefined ? Boolean(config.HEADERS) :
               true; // default value

// Show version and exit if --version flag is provided
if (args.version) {
	// const packageJson = require("../package.json");
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
  --use-emojis            Use emoji icons for folders and files (default: false)
  --gitignore             Respect rules in .gitignore file (default: false)
  --headers               Include detailed headers/metadata in output (default: true)

Examples:
  node treeGenerator.js                    # Generate tree for current directory
  node treeGenerator.js /path/to/project   # Generate tree for specific directory
  node treeGenerator.js -d                 # Generate directory-only tree
  node treeGenerator.js -o mytree.txt      # Save output to specific file
  node treeGenerator.js --max-depth 5      # Limit tree depth to 5 levels
  node treeGenerator.js --size --hidden    # Show file sizes and hidden files
  node treeGenerator.js --use-emojis       # Use emoji icons for folders and files
  node treeGenerator.js --gitignore        # Respect .gitignore rules
  node treeGenerator.js --no-headers       # Generate output without detailed headers
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
	// First check standard exclude patterns
	if (excludeFiles && Array.isArray(excludeFiles) && excludeFiles.some((pattern) => {
		if (typeof minimatch === 'function' && typeof pattern === 'string') {
			return minimatch(fileName, pattern);
		} else {
			// Fallback to simple string comparison if minimatch is not available
			return fileName === pattern || fileName.endsWith(pattern.replace(/^\*/, ''));
		}
	})) {
		return true;
	}
	
	// Then check .gitignore if enabled
	if (RESPECT_GITIGNORE && gitIgnoreRules) {
		// Convert fileName to a path relative to the directory containing .gitignore
		const relativePath = fileName;
		return gitIgnoreRules.denies(relativePath);
	}
	
	return false;
}

/**
 * Check if a folder should be excluded
 */
function isExcludedFolder(folderName, excludeFolders) {
	// First check standard exclude patterns
	if (excludeFolders.includes(folderName)) {
		return true;
	}
	
	// Then check .gitignore if enabled
	if (RESPECT_GITIGNORE && gitIgnoreRules) {
		// Convert folderName to a path relative to the directory containing .gitignore
		const relativePath = folderName;
		return gitIgnoreRules.denies(relativePath);
	}
	
	return false;
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
	return patterns.some((pattern) => {
		if (typeof minimatch === 'function' && typeof pattern === 'string') {
			return minimatch(filePath, pattern.trim());
		} else {
			// Fallback to simple string comparison if minimatch is not available
			return filePath.includes(pattern.trim());
		}
	});
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
const USE_EMOJIS = args["use-emojis"] || (process.env.USE_EMOJIS ? process.env.USE_EMOJIS === "true" : config.USE_EMOJIS) || false;
const RESPECT_GITIGNORE = args["gitignore"] || (process.env.RESPECT_GITIGNORE ? process.env.RESPECT_GITIGNORE === "true" : config.RESPECT_GITIGNORE) || false;

// Load .gitignore rules if the option is enabled
let gitIgnoreRules = null;
if (RESPECT_GITIGNORE && gitignoreParser) {
	try {
		// Look for .gitignore in the input directory and parent directories
		const gitIgnorePath = findGitignore(INPUT_DIR);
		if (gitIgnorePath) {
			const gitIgnoreContent = fs.readFileSync(gitIgnorePath, 'utf8');
			gitIgnoreRules = gitignoreParser.compile(gitIgnoreContent);
		}
	} catch (error) {
		console.warn("Could not load .gitignore:", error.message);
	}
}

/**
 * Find .gitignore file in the given directory or parent directories
 */
function findGitignore(startDir) {
	let currentDir = path.resolve(startDir);
	
	while (true) {
		const gitignorePath = path.join(currentDir, '.gitignore');
		if (fs.existsSync(gitignorePath)) {
			return gitignorePath;
		}
		
		const parentDir = path.dirname(currentDir);
		if (parentDir === currentDir) {
			// Reached the root directory
			break;
		}
		currentDir = parentDir;
	}
	
	return null;
}

const INCLUDE_EXTENSIONS = args.extensions || process.env.INCLUDE_EXTENSIONS || config.INCLUDE_EXTENSIONS || "";
const EXCLUDE_PATTERNS = args["exclude-patterns"] || process.env.EXCLUDE_PATTERNS || config.EXCLUDE_PATTERNS || "";
const OUTPUT_PATH = args["output-path"] || process.env.OUTPUT_PATH || config.OUTPUT_PATH || "./output";
const CREATE_SUBFOLDER = args.subfolder || (process.env.CREATE_SUBFOLDER ? process.env.CREATE_SUBFOLDER === "true" : config.CREATE_SUBFOLDER) || false;
const VERBOSE = args.verbose || (process.env.VERBOSE ? process.env.VERBOSE === "true" : config.VERBOSE) || false;
const COLOR_OUTPUT = args.color || (process.env.COLOR_OUTPUT ? process.env.COLOR_OUTPUT === "true" : config.COLOR_OUTPUT) || false;
const MAX_FILE_SIZE = args["max-file-size"] || parseInt(process.env.MAX_FILE_SIZE) || config.MAX_FILE_SIZE || 10485760; // 10MB default
const IGNORE_LIST = getArrayValue(args.ignore, process.env.IGNORE_LIST, config.IGNORE_LIST, ".DS_Store,Thumbs.db");
const EMOJI_FOLDER = (process.env.EMOJI_FOLDER || config.EMOJI_FOLDER) + " " || "📁 ";
const EMOJI_FILE = (process.env.EMOJI_FILE || config.EMOJI_FILE) + " " || "📄 ";

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
	console.log("✅ OUTPUT_FILE");
	console.log("OUTPUT_FILE=", OUTPUT_FILE);
	console.log(`args["output-file"]=`, args["output-file"]);
	console.log("process.env.OUTPUT_FILE=", process.env.OUTPUT_FILE);
	console.log("config.OUTPUT_FILE=", config.OUTPUT_FILE);
	console.log("----");
	console.log("✅ TAB");
	console.log("TAB=", TAB);
	console.log("args.tab=", args.tab);
	console.log("process.env.TAB=", process.env.TAB);
	console.log("config.TAB=", config.TAB);
	console.log("----");
	console.log("✅ BRANCH");
	console.log("BRANCH=", BRANCH);
	console.log("args.branch=", args.branch);
	console.log("process.env.BRANCH=", process.env.BRANCH);
	console.log("config.BRANCH=", config.BRANCH);
	console.log("----");
	console.log("✅ LAST_BRANCH");
	console.log("LAST_BRANCH=", LAST_BRANCH);
	console.log(`args["last-branch"]=`, args["last-branch"]);
	console.log("process.env.LAST_BRANCH=", process.env.LAST_BRANCH);
	console.log("config.LAST_BRANCH=", config.LAST_BRANCH);
	console.log("----");
	console.log("✅ EXCLUDE_FOLDERS");
	console.log("EXCLUDE_FOLDERS=", EXCLUDE_FOLDERS);
	console.log("args.exclude=", args.exclude);
	console.log("process.env.EXCLUDE_FOLDERS=", process.env.EXCLUDE_FOLDERS);
	console.log("config.EXCLUDE_FOLDERS=", config.EXCLUDE_FOLDERS);
	console.log("----");
	console.log("✅ EXCLUDE_FILES");
	console.log("EXCLUDE_FILES=", EXCLUDE_FILES);
	console.log("args.ignore=", args.ignore);
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
	console.log(`args["max-depth"]=`, args["max-depth"]);
	console.log("process.env.MAX_DEPTH=", process.env.MAX_DEPTH);
	console.log("config.MAX_DEPTH=", config.MAX_DEPTH);
	console.log("----");
	console.log("✅ SHOW_HIDDEN");
	console.log("SHOW_HIDDEN=", SHOW_HIDDEN);
	console.log("args.hidden=", args.hidden);
	console.log("process.env.SHOW_HIDDEN=", process.env.SHOW_HIDDEN);
	console.log("config.SHOW_HIDDEN=", config.SHOW_HIDDEN);
	console.log("----");
	console.log("✅ SHOW_SIZE");
	console.log("SHOW_SIZE=", SHOW_SIZE);
	console.log("args.size=", args.size);
	console.log("process.env.SHOW_SIZE=", process.env.SHOW_SIZE);
	console.log("config.SHOW_SIZE=", config.SHOW_SIZE);
	console.log("----");
	console.log("✅ SHOW_PERMISSIONS");
	console.log("SHOW_PERMISSIONS=", SHOW_PERMISSIONS);
	console.log("args.permissions=", args.permissions);
	console.log("process.env.SHOW_PERMISSIONS=", process.env.SHOW_PERMISSIONS);
	console.log("config.SHOW_PERMISSIONS=", config.SHOW_PERMISSIONS);
	console.log("----");
	console.log("✅ SHOW_LAST_MODIFIED");
	console.log("SHOW_LAST_MODIFIED=", SHOW_LAST_MODIFIED);
	console.log("args.modified=", args.modified);
	console.log("process.env.SHOW_LAST_MODIFIED=", process.env.SHOW_LAST_MODIFIED);
	console.log("config.SHOW_LAST_MODIFIED=", config.SHOW_LAST_MODIFIED);
	console.log("----");
	console.log("✅ INCLUDE_EXTENSIONS");
	console.log("INCLUDE_EXTENSIONS=", INCLUDE_EXTENSIONS);
	console.log("args.extensions=", args.extensions);
	console.log("process.env.INCLUDE_EXTENSIONS=", process.env.INCLUDE_EXTENSIONS);
	console.log("config.INCLUDE_EXTENSIONS=", config.INCLUDE_EXTENSIONS);
	console.log("----");
	console.log("✅ EXCLUDE_PATTERNS");
	console.log("EXCLUDE_PATTERNS=", EXCLUDE_PATTERNS);
	console.log(`args["exclude-patterns"]=`, args["exclude-patterns"]);
	console.log("process.env.EXCLUDE_PATTERNS=", process.env.EXCLUDE_PATTERNS);
	console.log("config.EXCLUDE_PATTERNS=", config.EXCLUDE_PATTERNS);
	console.log("----");
	console.log("✅ OUTPUT_PATH");
	console.log("OUTPUT_PATH=", OUTPUT_PATH);
	console.log("args.output-path=", args.output-path);
	console.log("process.env.OUTPUT_PATH=", process.env.OUTPUT_PATH);
	console.log("config.OUTPUT_PATH=", config.OUTPUT_PATH);
	console.log("----");
	console.log("✅ CREATE_SUBFOLDER");
	console.log("CREATE_SUBFOLDER=", CREATE_SUBFOLDER);
	console.log("args.subfolder=", args.subfolder);
	console.log("process.env.CREATE_SUBFOLDER=", process.env.CREATE_SUBFOLDER);
	console.log("config.CREATE_SUBFOLDER=", config.CREATE_SUBFOLDER);
	console.log("----");
	console.log("✅ VERBOSE");
	console.log("VERBOSE=", VERBOSE);
	console.log("args.verbose=", args.verbose);
	console.log("process.env.VERBOSE=", process.env.VERBOSE);
	console.log("config.VERBOSE=", config.VERBOSE);
	console.log("----");
	console.log("✅ COLOR_OUTPUT");
	console.log("COLOR_OUTPUT=", COLOR_OUTPUT);
	console.log("args.color=", args.color);
	console.log("process.env.COLOR_OUTPUT=", process.env.COLOR_OUTPUT);
	console.log("config.COLOR_OUTPUT=", config.COLOR_OUTPUT);
	console.log("----");
	console.log("✅ MAX_FILE_SIZE");
	console.log("MAX_FILE_SIZE=", MAX_FILE_SIZE);
	console.log(`args["max-file-size"]=`, args["max-file-size"]);
	console.log("process.env.MAX_FILE_SIZE=", process.env.MAX_FILE_SIZE);
	console.log("config.MAX_FILE_SIZE=", config.MAX_FILE_SIZE);
	console.log("----");
	console.log("✅ IGNORE_LIST");
	console.log("IGNORE_LIST=", IGNORE_LIST);
	console.log("args.ignore=", args.ignore);
	console.log("process.env.IGNORE_LIST=", process.env.IGNORE_LIST);
	console.log("config.IGNORE_LIST=", config.IGNORE_LIST);
	console.log("----");
	console.log("✅ USE_EMOJIS");
	console.log("USE_EMOJIS=", USE_EMOJIS);
	console.log("args.use-emojis=", args["use-emojis"]);
	console.log("process.env.USE_EMOJIS=", process.env.USE_EMOJIS);
	console.log("config.USE_EMOJIS=", config.USE_EMOJIS);
	console.log("----");
	console.log("✅ RESPECT_GITIGNORE");
	console.log("RESPECT_GITIGNORE=", RESPECT_GITIGNORE);
	console.log("args.gitignore=", args["gitignore"]);
	console.log("process.env.RESPECT_GITIGNORE=", process.env.RESPECT_GITIGNORE);
	console.log("config.RESPECT_GITIGNORE=", config.RESPECT_GITIGNORE);
	console.log("gitIgnoreRules loaded=", !!gitIgnoreRules);
	console.log("----");
	console.log("✅ HEADERS");
	console.log("HEADERS=", HEADERS);
	console.log("args.headers=", args["headers"]);
	console.log(`args["no-headers"]=`, args["no-headers"]);
	console.log("process.env.HEADERS=", process.env.HEADERS);
	console.log("config.HEADERS=", config.HEADERS);
	console.log("----");
	// console.log("----");
	// console.log("----");
	// console.log("✅ VERSION");
	// console.log("args.version=", args.version);
	// console.log("----");
	// console.log("✅ HELP");
	// console.log("args.help=", args.help);
	// console.log("----");
	// console.log("✅ DIRECTORY_ONLY");
	// console.log("args.dir-only=", args.dir-only);
	// console.log("----");
	// console.log("✅ EXCLUDE_PATTERNS");
	// console.log("args.exclude-patterns =", args.exclude-patterns );
	// console.log("----");
	// console.log("✅ INPUT_DIR");
	// console.log("args.INPUT_DIR=", args.INPUT_DIR);
	// console.log("process.env.INPUT_DIR=", process.env.INPUT_DIR);
	// console.log("config.INPUT_DIR=", config.INPUT_DIR);
	console.log("----");
	console.log("----");
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes) {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Count folders and files without generating output
 */
function countItems(folderPath, excludeFolders, excludeFiles = EXCLUDE_FILES, depth = 0) {
	if (depth > MAX_DEPTH) return { folderCount: 0, fileCount: 0, totalSize: 0 };

	let folderCount = 0;
	let fileCount = 0;
	let totalSize = 0;

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
				totalSize += childCounts.totalSize;
			}
		} else {
			// Apply all filters for files
			if (!isExcludedFile(item, excludeFiles) && isIncludedExtension(item) && !matchesExcludePattern(itemPath)) {
				// Check file size if MAX_FILE_SIZE is set
				if (MAX_FILE_SIZE > 0) {
					const fileSize = getFileSize(itemPath);
					if (fileSize <= MAX_FILE_SIZE) {
						fileCount++;
						totalSize += fileSize;
					}
				} else {
					const fileSize = getFileSize(itemPath);
					fileCount++;
					totalSize += fileSize;
				}
			}
		}
	}

	return { folderCount, fileCount, totalSize };
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
			const folderPrefix = USE_EMOJIS ? EMOJI_FOLDER : "";
			result += `${prefix}${branchChar}${folderPrefix}${item}${additionalInfo}\n`;
			// For subfolder content, adjust prefix appropriately
			// If this is not the last item, use vertical bar prefix; otherwise use spaces
			const subPrefix = isLast ? prefix + "" : prefix + TAB; // Use vertical bars for non-last items, spaces for last
			result += processFolder(itemPath, subPrefix, excludeFolders, excludeFiles, false, depth + 1);
		} else {
			// Process file
			const filePrefix = USE_EMOJIS ? EMOJI_FILE : "";
			result += `${prefix}${branchChar}${filePrefix}${item}${additionalInfo}\n`;
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
	const totalSize = counts.totalSize || 0;

	// Load package.json for metadata
	// const packageJson = require("../package.json");

	let result = "";
	// if  (HEADERS==="true") {
	if  (HEADERS) {
	result += "============================================\n";
	result += "Directory Tree Generator\n";
	result += "============================================\n";
	result += `Version     : ${packageJson.version}\n`;
	result += `Generated   : ${new Date().toISOString()}\n`;
	result += `Root        : ${path.resolve(rootDir)}\n`;
	result += `URL         : https://javiramoslab.com/tree-directory-generator/\n`;
	result += `Docs        : https://javiramoslab.com/tree-directory-generator/docs\n`;
	result += `Schema      : https://javiramoslab.com/tree-directory-generator/schema\n`;
	result += "============================================\n";
	result += `Folders     : ${folderCount}\n`;
	result += `Files       : ${fileCount}\n`;
	result += `Size        : ${formatBytes(totalSize)}\n`;
	// result += `Destination : Console\n`;
	result += `Output file : ${OUTPUT_FILE}.${FORMAT}\n`;
	result += `Format      : ${FORMAT.toUpperCase()}\n`;
	result += `Max Depth   : ${MAX_DEPTH}\n`;
	result += `Filters     : ${DIR_ONLY_MODE ? 'directories only' : 'all files'}\n`;
	if (INCLUDE_EXTENSIONS) result += `Extensions  : ${INCLUDE_EXTENSIONS}\n`;
	if (EXCLUDE_FOLDERS.length > 0) result += `Excluded    : ${EXCLUDE_FOLDERS.join(', ')}\n`;
	result += "============================================\n\n";
	}

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
		const fileInfo = { name: folderName, type: "file" };
		if (USE_EMOJIS) {
			fileInfo.emoji = "📄";
		}
		return fileInfo;
	}

	const items = fs.readdirSync(folderPath);
	const structure = {
		name: folderName,
		type: "folder",
		children: [],
	};
	
	if (USE_EMOJIS) {
		structure.emoji = "📁";
	}

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
		const fileInfo = {
			name: file,
			type: "file",
		};
		
		if (USE_EMOJIS) {
			fileInfo.emoji = "📄";
		}
		
		structure.children.push(fileInfo);
	}

	return structure;
}

/**
 * Format output based on the specified format
 */
function formatOutput(rootDir, format, excludeFolders, excludeFiles = EXCLUDE_FILES) {
	switch (format.toLowerCase()) {
		case "json": {
			if (HEADERS) {
				// const packageJson = require("../package.json");
				const counts = countItems(rootDir, excludeFolders, excludeFiles);
				
				const jsonStructure = {
					metadata: {
						name: packageJson.name,
						version: packageJson.version,
						description: packageJson.description,
						author: packageJson.author,
						license: packageJson.license,
						url: "https://javiramoslab.com/tree-directory-generator/",
						docs: "https://javiramoslab.com/tree-directory-generator/docs",
						schema: "https://javiramoslab.com/tree-directory-generator/schema",
						generated: new Date().toISOString(),
						generator: {
							name: packageJson.name,
							version: packageJson.version,
							platform: process.platform,
							nodeVersion: process.version
						},
						root: path.resolve(rootDir),
						stats: {
							folders: counts.folderCount,
							files: counts.fileCount,
							size: counts.totalSize,
							sizeFormatted: formatBytes(counts.totalSize),
							outputFile: `${OUTPUT_FILE}.${FORMAT}`,
							format: FORMAT.toUpperCase(),
							maxDepth: MAX_DEPTH,
							filters: DIR_ONLY_MODE ? 'directories only' : 'all files'
						},
						config: {
							showHidden: SHOW_HIDDEN,
							showSize: SHOW_SIZE,
							showPermissions: SHOW_PERMISSIONS,
							showLastModified: SHOW_LAST_MODIFIED,
							useEmojis: USE_EMOJIS,
							respectGitignore: RESPECT_GITIGNORE,
							includeExtensions: INCLUDE_EXTENSIONS,
							excludeFolders: EXCLUDE_FOLDERS,
							excludePatterns: EXCLUDE_PATTERNS,
							dirOnlyMode: DIR_ONLY_MODE,
							maxFileSize: MAX_FILE_SIZE
						}
					},
					tree: generateJsonStructure(rootDir, excludeFolders, excludeFiles, true)
				};
				return JSON.stringify(jsonStructure, null, 2);
			} else {
				// Return just the tree structure without metadata when headers are disabled
				const jsonStructure = generateJsonStructure(rootDir, excludeFolders, excludeFiles, true);
				return JSON.stringify(jsonStructure, null, 2);
			}
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
	if (FORMAT.toLowerCase() === 'json') {
		// For JSON format, use .tree.json as subformat
		if (!fileName.endsWith('.tree.json')) {
			if (fileName.endsWith('.json')) {
				// If already ends with .json, replace it with .tree.json
				fileName = fileName.slice(0, -5) + '.tree.json';
			} else {
				// Otherwise, append .tree.json
				fileName += '.tree.json';
			}
		}
	} else if (!fileName.endsWith(`.${FORMAT}`)) {
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
	if (HEADERS) {
		console.log(`Folders     : ${counts.folderCount}`);
		console.log(`Files       : ${counts.fileCount}`);
		console.log(`Size        : ${formatBytes(counts.totalSize)}`);
		console.log(`Destination : ${fileName}`);
		console.log(`Generated   : ${new Date().toISOString()}`);
		console.log(`Root        : ${path.resolve(rootDir)}`);
	} else {
		console.log(`Saved ${counts.folderCount} folders and ${counts.fileCount} files to ${fileName}`);
	}

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

/**
 * Main function to run the tree generator - exported for NPM package usage
 */
async function generateTreeStructure(options = {}) {
	// Extract options with defaults based on existing constants
	const {
		folderPath = INPUT_DIR,
		outputFile = OUTPUT_FILE,
		format = FORMAT,
		maxDepth = MAX_DEPTH,
		showHidden = SHOW_HIDDEN,
		showSize = SHOW_SIZE,
		showPermissions = SHOW_PERMISSIONS,
		showLastModified = SHOW_LAST_MODIFIED,
		dirOnly = false, // DIR_ONLY_MODE is determined differently
		excludeFolders = EXCLUDE_FOLDERS,
		excludeFiles = EXCLUDE_FILES,
		includeExtensions = INCLUDE_EXTENSIONS,
		excludePatterns = EXCLUDE_PATTERNS,
		outputPath = OUTPUT_PATH,
		createSubfolder = CREATE_SUBFOLDER,
		verbose = VERBOSE,
		color = COLOR_OUTPUT,
		useEmojis = USE_EMOJIS,
		respectGitignore = RESPECT_GITIGNORE,
		headers = HEADERS,
		maxFileSize = MAX_FILE_SIZE,
		ignoreList = IGNORE_LIST,
		tab = TAB,
		branch = BRANCH,
		lastBranch = LAST_BRANCH
	} = options;

	// Use the provided folderPath or default to INPUT_DIR
	let rootDir = folderPath;

	// If rootDir is '.', resolve to the actual current working directory name
	if (rootDir === ".") {
		rootDir = process.cwd();
	} else if (rootDir === "..") {
		rootDir = path.dirname(process.cwd());
	}

	// Validate input directory
	if (!fs.existsSync(rootDir)) {
		throw new Error("Directory does not exist.");
	}

	// Combine excludeFolders and ignoreList
	const combinedExcludeFolders = [...new Set([...excludeFolders, ...ignoreList])];
	const resolvedExcludeFiles = dirOnly
		? ["*"]
		: excludeFiles;

	// Create a version of formatOutput that accepts all parameters
	const formatOutputWithParams = (rootDir, format, excludeFolders, excludeFiles, options) => {
		switch (format.toLowerCase()) {
			case "json": {
				if (options.headers) {
					const counts = countItems(rootDir, excludeFolders, excludeFiles);
					
					const jsonStructure = {
						metadata: {
							name: packageJson.name,
							version: packageJson.version,
							description: packageJson.description,
							author: packageJson.author,
							license: packageJson.license,
							url: "https://javiramoslab.com/tree-directory-generator/",
							docs: "https://javiramoslab.com/tree-directory-generator/docs",
							schema: "https://javiramoslab.com/tree-directory-generator/schema",
							generated: new Date().toISOString(),
							generator: {
								name: packageJson.name,
								version: packageJson.version,
								platform: process.platform,
								nodeVersion: process.version
							},
							root: path.resolve(rootDir),
							stats: {
								folders: counts.folderCount,
								files: counts.fileCount,
								size: counts.totalSize,
								sizeFormatted: formatBytes(counts.totalSize),
								outputFile: `${options.outputFile}.${format}`,
								format: format.toUpperCase(),
								maxDepth: options.maxDepth,
								filters: options.dirOnly ? 'directories only' : 'all files'
							},
							config: {
								showHidden: options.showHidden,
								showSize: options.showSize,
								showPermissions: options.showPermissions,
								showLastModified: options.showLastModified,
								useEmojis: options.useEmojis,
								respectGitignore: options.respectGitignore,
								includeExtensions: options.includeExtensions,
								excludeFolders: excludeFolders,
								excludePatterns: options.excludePatterns,
								dirOnlyMode: options.dirOnly,
								maxFileSize: options.maxFileSize
							}
						},
						tree: generateJsonStructure(rootDir, excludeFolders, excludeFiles, true)
					};
					return JSON.stringify(jsonStructure, null, 2);
				} else {
					// Return just the tree structure without metadata when headers are disabled
					const jsonStructure = generateJsonStructure(rootDir, excludeFolders, excludeFiles, true);
					return JSON.stringify(jsonStructure, null, 2);
				}
			}

			case "tree":
			case "txt":
			default:
				// For text format, we need a version that accepts all parameters
				const generateTxtStructureWithParams = (rootDir, excludeFolders, excludeFiles, options) => {
					// Count items first
					const counts = countItems(rootDir, excludeFolders, excludeFiles);
					const folderCount = counts.folderCount;
					const fileCount = counts.fileCount;
					const totalSize = counts.totalSize || 0;

					let result = "";
					if (options.headers) {
						result += "============================================\n";
						result += "Directory Tree Generator\n";
						result += "============================================\n";
						result += `Version     : ${packageJson.version}\n`;
						result += `Generated   : ${new Date().toISOString()}\n`;
						result += `Root        : ${path.resolve(rootDir)}\n`;
						result += `URL         : https://javiramoslab.com/tree-directory-generator/\n`;
						result += `Docs        : https://javiramoslab.com/tree-directory-generator/docs\n`;
						result += `Schema      : https://javiramoslab.com/tree-directory-generator/schema\n`;
						result += "============================================\n";
						result += `Folders     : ${folderCount}\n`;
						result += `Files       : ${fileCount}\n`;
						result += `Size        : ${formatBytes(totalSize)}\n`;
						result += `Output file : ${options.outputFile}.${format}\n`;
						result += `Format      : ${format.toUpperCase()}\n`;
						result += `Max Depth   : ${options.maxDepth}\n`;
						result += `Filters     : ${options.dirOnly ? 'directories only' : 'all files'}\n`;
						if (options.includeExtensions) result += `Extensions  : ${options.includeExtensions}\n`;
						if (excludeFolders.length > 0) result += `Excluded    : ${excludeFolders.join(', ')}\n`;
						result += "============================================\n\n";
					}

					// Add root folder name at the top
					const rootFolderName = path.basename(rootDir);
					result += `${rootFolderName}\n`;

					// For processFolder, we need to pass the parameters
					const processFolderWithParams = (folderPath, prefix, excludeFolders, excludeFiles, isRoot = false, depth = 0) => {
						if (depth > options.maxDepth) return "";

						let result = "";

						// Read the contents of the folder
						const items = fs.readdirSync(folderPath);

						let files = [];
						let subFolders = [];

						// Separate files and folders
						for (const item of items) {
							// Skip hidden files if SHOW_HIDDEN is false
							if (!options.showHidden && isHiddenFile(item)) {
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
								if (options.dirOnly) {
									continue;
								}

								// Apply all filters for files
								if (!isExcludedFile(item, excludeFiles) && isIncludedExtension(item) && !matchesExcludePattern(itemPath)) {
									// Check file size if MAX_FILE_SIZE is set
									if (options.maxFileSize > 0) {
										const fileSize = getFileSize(itemPath);
										if (fileSize <= options.maxFileSize) {
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
							const branchChar = isLast ? options.lastBranch : options.branch;

							// Prepare additional information based on configuration settings
							let additionalInfo = "";
							if (stat.isFile()) {
								if (options.showSize) {
									const size = getFileSize(itemPath);
									additionalInfo += ` [${size} bytes]`;
								}
								if (options.showPermissions) {
									const perms = getFilePermissions(itemPath);
									additionalInfo += ` [${perms}]`;
								}
								if (options.showLastModified) {
									const modDate = getLastModified(itemPath);
									additionalInfo += ` [${modDate}]`;
								}
							}

							if (stat.isDirectory()) {
								// Process subfolder
								const folderPrefix = options.useEmojis ? "📁 " : "";
								result += `${prefix}${branchChar}${folderPrefix}${item}${additionalInfo}\n`;
								// For subfolder content, adjust prefix appropriately
								// If this is not the last item, use vertical bar prefix; otherwise use spaces
								const subPrefix = isLast ? prefix + "" : prefix + options.tab; // Use vertical bars for non-last items, spaces for last
								result += processFolderWithParams(itemPath, subPrefix, excludeFolders, excludeFiles, false, depth + 1);
							} else {
								// Process file
								const filePrefix = options.useEmojis ? "📄 " : "";
								result += `${prefix}${branchChar}${filePrefix}${item}${additionalInfo}\n`;
							}
						}

						return result;
					};

					result += processFolderWithParams(rootDir, "", excludeFolders, excludeFiles, true);

					return result;
				};

				return generateTxtStructureWithParams(rootDir, excludeFolders, excludeFiles, options);
		}
	};

	// Generate the output based on the specified format using our parameterized version
	const output = formatOutputWithParams(rootDir, format, combinedExcludeFolders, resolvedExcludeFiles, {
		outputFile,
		format,
		maxDepth,
		showHidden,
		showSize,
		showPermissions,
		showLastModified,
		dirOnly,
		includeExtensions,
		excludePatterns,
		outputPath,
		createSubfolder,
		verbose,
		color,
		useEmojis,
		respectGitignore,
		headers,
		maxFileSize,
		tab,
		branch,
		lastBranch
	});

	// Determine the output file name based on format
	let fileName = outputFile;
	if (format.toLowerCase() === 'json') {
		// For JSON format, use .tree.json as subformat
		if (!fileName.endsWith('.tree.json')) {
			if (fileName.endsWith('.json')) {
				// If already ends with .json, replace it with .tree.json
				fileName = fileName.slice(0, -5) + '.tree.json';
			} else {
				// Otherwise, append .tree.json
				fileName += '.tree.json';
			}
		}
	} else if (!fileName.endsWith(`.${format}`)) {
		fileName += `.${format}`;
	}

	// Create output directory if needed
	if (createSubfolder) {
		if (!fs.existsSync(outputPath)) {
			fs.mkdirSync(outputPath, { recursive: true });
		}
		fileName = path.join(outputPath, fileName);
	}

	// Write the output to the file
	fs.writeFileSync(fileName, output);

	// Count items for display purposes
	const counts = countItems(rootDir, combinedExcludeFolders, resolvedExcludeFiles);

	// For JSON format, parse and return the full structure
	let jsonStructureResult = null;
	if (format.toLowerCase() === 'json') {
		jsonStructureResult = JSON.parse(output);
	} else {
		// For non-JSON formats, create a simplified structure
		jsonStructureResult = {
			metadata: {
				name: packageJson.name,
				version: packageJson.version,
				description: packageJson.description,
				author: packageJson.author,
				license: packageJson.license,
				url: "https://javiramoslab.com/tree-directory-generator/",
				docs: "https://javiramoslab.com/tree-directory-generator/docs",
				schema: "https://javiramoslab.com/tree-directory-generator/schema",
				generated: new Date().toISOString(),
				generator: {
					name: packageJson.name,
					version: packageJson.version,
					platform: process.platform,
					nodeVersion: process.version
				},
				root: path.resolve(rootDir),
				stats: {
					folders: counts.folderCount,
					files: counts.fileCount,
					size: counts.totalSize,
					sizeFormatted: formatBytes(counts.totalSize),
					outputFile: `${outputFile}.${format}`,
					format: format.toUpperCase(),
					maxDepth: maxDepth,
					filters: dirOnly ? 'directories only' : 'all files'
				},
				config: {
					showHidden: showHidden,
					showSize: showSize,
					showPermissions: showPermissions,
					showLastModified: showLastModified,
					useEmojis: useEmojis,
					respectGitignore: respectGitignore,
					includeExtensions: includeExtensions,
					excludeFolders: combinedExcludeFolders,
					excludePatterns: excludePatterns,
					dirOnlyMode: dirOnly,
					maxFileSize: maxFileSize
				}
			},
			tree: generateJsonStructure(rootDir, combinedExcludeFolders, resolvedExcludeFiles, true)
		};
	}

	return {
		success: true,
		message: `Directory structure saved to ${fileName}`,
		outputPath: fileName,
		metadata: jsonStructureResult.metadata,
		tree: jsonStructureResult.tree,
		fullJsonStructure: jsonStructureResult,
		stats: {
			folders: counts.folderCount,
			files: counts.fileCount,
			size: counts.totalSize,
			sizeFormatted: formatBytes(counts.totalSize)
		},
		options: {
			folderPath: rootDir,
			format,
			maxDepth,
			showHidden,
			showSize,
			showPermissions,
			showLastModified,
			dirOnly,
			includeExtensions,
			excludePatterns,
			outputPath,
			createSubfolder,
			verbose,
			color,
			useEmojis,
			respectGitignore,
			headers,
			maxFileSize
		}
	};
}

module.exports = {
	generateTreeStructure,
	processFolder,
	generateTxtStructure,
	generateJsonStructure,
	formatOutput,
	formatBytes,
	countItems,
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
	USE_EMOJIS,
	RESPECT_GITIGNORE,
	INCLUDE_EXTENSIONS,
	EXCLUDE_PATTERNS,
	OUTPUT_PATH,
	CREATE_SUBFOLDER,
	VERBOSE,
	COLOR_OUTPUT,
	MAX_FILE_SIZE,
	HEADERS,
	IGNORE_LIST,
};
