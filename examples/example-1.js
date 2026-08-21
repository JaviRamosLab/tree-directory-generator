// const { generateTreeStructure } = require('tree-directory-generator');
const { generateTreeStructure } = require('../src/treeGenerator');

const generateTreeStructureParams = {
  folderPath: ".",
  outputFile:  "directory-structure",
  format:  "txt",
  maxDepth:  10,
  showHidden:  false,
  showSize:  false,
  showPermissions:  false,
  showLastModified:  false,
  dirOnly:  false,
  excludeFolders:  [".git", "node_modules", "dist", "build"],
  excludeFiles:  ["Desktop.ini", "*.tmp", "*.log", "*.bak", "*.swp"],
  includeExtensions:  "",
  excludePatterns:  "",
  outputPath:  "./output",
  createSubfolder:  false,
  verbose:  false,
  color:  false,
  useEmojis:  false,
  respectGitignore:  false,
  headers:  true,
  maxFileSize:  10485760,
  ignoreList:  [".DS_Store", "Thumbs.db"],
  tab:  "│   ",
  branch:  "├── ",
  lastBranch:  "└── ",
  generateFile: false
};

console.log("Generating directory structure...");
// console.log("generateTreeStructureParams= " + JSON.stringify(generateTreeStructureParams, null, 2));

// Call the function with the parameters
(async () => {
  try {
    // const result = await treeDirectoryGenerator(generateTreeStructureParams);
    const result = await generateTreeStructure(generateTreeStructureParams);
    console.log("----");
    console.log("message:", result.message);
    console.log("Full result:");
    console.log(JSON.stringify(result, null, 2)); // Pretty-print the full result
    console.log("----");
  } catch (error) {
    console.error("Error generating directory tree:", error);
  }
})();