const {
  generateTreeStructure,
} = require("../src/treeGenerator");

// Example using generateTreeStructure
(async () => {
  try {
    const result = await generateTreeStructure({
      folderPath: ".",
      outputFile: "my-tree-alt",
      format: "txt",
      maxDepth: 3,
      showSize: true,
      headers: false,
    });

    console.log("message=", result.message); // Directory structure saved to ./output/my-tree.json
    console.log("stats=", result.stats); // Folder and file counts
  } catch (error) {
    console.error("Error generating tree structure:", error);
  }
})();