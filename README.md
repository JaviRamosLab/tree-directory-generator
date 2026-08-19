# Directory Tree Generator

A versatile JavaScript utility for generating visual representations of directory structures in multiple formats.

## Overview

The Directory Tree Generator is a cross-platform Node.js script that creates visual representations of directory structures with customizable output formats and exclusion rules. It supports three output formats: plain text, tree format, and JSON.

## Features

- **Multiple Output Formats**: Generate directory trees in `.txt`, `.tree`, or `.json` formats
- **Customizable Exclusions**: Exclude specific folders from scanning (e.g., `.git`, `node_modules`)
- **Accurate Counting**: Precise counts of folders and files
- **Visual Hierarchy**: Proper indentation and connection symbols (`├──`, `└──`, `│`) to represent directory structure
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Configurable Constants**: Easily adjustable output settings

## Installation & Usage

### Prerequisites

- Node.js installed on your system

### Running the Script

```bash
node treeGenerator.js [directory] [format] [exclude_folders]
```

### Parameters

- `[directory]`: Path to the directory to scan (defaults to current directory `.`)
- `[format]`: Output format (`txt`, `tree`, or `json`) (defaults to `txt`)
- `[exclude_folders]`: Comma-separated list of folders to exclude (defaults to `.git,node_modules,dist,build`)

### Examples

```bash
# Generate tree for current directory in default format (txt)
node treeGenerator.js

# Generate tree for specific directory in JSON format
node treeGenerator.js /path/to/project json

# Generate tree excluding custom folders
node treeGenerator.js ./my-project txt ".git,.cache,temp"

# Generate tree in .tree format
node treeGenerator.js ./src tree
```

## Output Format

### Text/Tree Format

The text format provides a visual representation of the directory structure:

```
==========================================================
Windows Visual Directory Tree Generator
==========================================================
Directory structure generated on Wed Aug 19 2026 ...
Total number of folders: 5
Total number of files: 12
==========================================================

project-root
├── .github
│   ├── workflows
│   └── ISSUE_TEMPLATE
├── src
│   ├── components
│   │   ├── Header.js
│   │   └── Footer.js
│   └── index.js
└── package.json
```

### JSON Format

The JSON format provides a structured representation:

```json
{
  "name": "project-root",
  "type": "folder",
  "children": [
    {
      "name": ".github",
      "type": "folder",
      "children": [
        {
          "name": "workflows",
          "type": "folder",
          "children": []
        },
        {
          "name": "ISSUE_TEMPLATE",
          "type": "folder",
          "children": []
        }
      ]
    },
    {
      "name": "src",
      "type": "folder",
      "children": [
        // ... more structure
      ]
    }
  ]
}
```

## Configuration Constants

The script defines several configurable constants:

| Constant          | Default Value                               | Description                      |
| ----------------- | ------------------------------------------- | -------------------------------- |
| `OUTPUT_FILE`     | `'directory-structure'`                     | Base name for output files       |
| `TAB`             | `'│   '`                                    | Indentation string for hierarchy |
| `BRANCH`          | `'├── '`                                    | Prefix for non-terminal items    |
| `EXCLUDE_FOLDERS` | `['.git', 'node_modules', 'dist', 'build']` | Folders to exclude from scan     |
| `INPUT_DIR`       | `process.argv[2]` or `'.'`                  | Directory to scan                |
| `FORMAT`          | `process.argv[3]` or `'txt'`                | Output format                    |

## Visual Symbols

The script uses the following symbols to represent the directory structure:

- `├──`: Used for items that have siblings below them
- `└──`: Used for the last item in a directory (terminal item)
- `│`: Vertical connector for continuing the hierarchy

## Implementation Details

### Counting Algorithm

The script separates counting from output generation to ensure accurate folder and file counts in both CLI output and file output.

### Exclusion Logic

The exclusion logic prevents specified folders from appearing in the output, helping to reduce clutter from irrelevant directories like `.git` or build artifacts.

### Cross-Platform Compatibility

The script uses Node.js built-in modules (`fs`, `path`) to ensure compatibility across different operating systems.

## Customization

### Changing Default Exclusions

Modify the `EXCLUDE_FOLDERS` constant to change the default excluded folders:

```javascript
const EXCLUDE_FOLDERS = [".git", "node_modules", "dist", "build", ".cache"];
```

### Modifying Output Format

Change the `TAB` and `BRANCH` constants to customize the visual appearance:

```javascript
const TAB = "    "; // Different indentation
const BRANCH = "|-- "; // Different branch character
```

## Troubleshooting

### Common Issues

1. **Directory not found**: Ensure the specified directory exists and is accessible
2. **Permission denied**: Make sure you have read permissions for the directory
3. **Empty output**: Verify that the directory contains files/folders

### Performance Considerations

- Large directory structures may take time to process
- Deeply nested structures may consume significant memory
- Excluding large folders (like `node_modules`) improves performance

## Integration

The script can be integrated into:

- Build processes
- Documentation generation workflows
- Repository analysis tools
- CI/CD pipelines

## License

This script is open source and available under the MIT License.
