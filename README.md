# Tree Directory Generator

A versatile JavaScript utility for generating visual representations of directory structures in multiple formats.

## Overview

The Tree Directory Generator is a cross-platform Node.js script that creates visual representations of directory structures with customizable output formats and exclusion rules. It supports three output formats: plain text, tree format, and JSON.

This project draws inspiration from excellent tools like:

- [Python's rptree](https://github.com/realpython/rptree) - A Python-based directory tree generator
- [Windows Visual Directory Tree Generator](https://github.com/BVisagie/windows-visual-directory-tree-generator) - A Windows-specific directory visualization tool

Like the original [RP Tree](https://github.com/realpython/rptree) Python tool, this JavaScript version allows you to generate directory tree diagrams with a simple command. Similar to the [Windows Visual Directory Tree Generator](https://github.com/BVisagie/windows-visual-directory-tree-generator), it provides proper ├── / └── connectors and supports various output formats.

## Features

- **Multiple Output Formats**: Generate directory trees in `.txt`, `.tree`, or `.json` formats
- **Customizable Exclusions**: Exclude specific folders and files from scanning (e.g., `.git`, `node_modules`, temporary files)
- **Accurate Counting**: Precise counts of folders and files
- **Visual Hierarchy**: Proper indentation and connection symbols (`├──`, `└──`, `│`) to represent directory structure
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Configurable Constants**: Easily adjustable output settings via command-line arguments, environment variables, or config file
- **Advanced Filtering**: Support for file extension inclusion, pattern-based exclusion, and file size limits
- **Metadata Display**: Optional display of file sizes, permissions, and last modified dates
- **Hidden File Management**: Option to show or hide hidden files
- **Depth Control**: Configurable maximum directory depth for traversal
- **Output Management**: Configurable output path and subfolder creation
- **Directory-Only Mode**: Option to generate tree with directories only (similar to rptree's `-d` flag)
- **Guided Setup**: Configuration via command-line arguments, environment variables, or config file (inspired by Windows tool's guided setup)
- **Size Reporting**: Optional file size display in human-readable format
- **Progress Indication**: Console output during scanning process
- **Gitignore Support**: Respects rules in `.gitignore` file when determining which files and folders to exclude
- **Emoji Support**: Customizable emoji icons for folders and files (e.g., 📁 for folders, 📄 for files)
- **Headers/Metadata Toggle**: Option to include or exclude detailed header information in output via `--headers`/`--no-headers` flags

## Gitignore Integration

The Tree Directory Generator now respects rules in your `.gitignore` file when determining which files and folders to exclude from the tree output. This ensures consistency with your Git repository's ignored files and makes the generated tree more relevant to your project's actual source code.

For projects using this tool, consider adding these entries to your `.gitignore` file to prevent generated files from being committed:

```text
# Tree Directory Generator outputs
/data/
/output/
config/config.json
```

## Emoji Support

Enhance your directory tree visualization with customizable emoji icons:

- Folders are displayed with the 📁 emoji by default
- Files are displayed with the 📄 emoji by default
- Customize emojis via command-line arguments, environment variables, or config file

Example with emojis enabled:

```text
📁 project-root
├── 📁 .github
│   ├── 📁 workflows
│   └── 📁 ISSUE_TEMPLATE
├── 📁 src
│   ├── 📁 components
│   │   ├── 📄 Header.js [1204 bytes]
│   │   └── 📄 Footer.js [856 bytes] [644] [08/19/2026]
│   └── 📄 index.js
└── 📄 package.json
```

## Headers/Metadata Toggle

The tool includes a `--headers` flag (enabled by default) that controls whether detailed metadata is included in the output. Use `--no-headers` to generate cleaner output without metadata headers, or `--headers` to ensure metadata is included (this is the default behavior).

## Installation & Usage

### Prerequisites

- Node.js installed on your system
- Install dependencies: `npm install && npm install minimist dotenv minimatch gitignore-parser`

### Running the Script

```bash
node treeGenerator.js [options] [directory]
```

### Command Line Options

The script accepts the following command line options:

```
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
  --no-headers            Exclude detailed headers/metadata from output (overrides --headers)
```

### Examples

```bash
# Generate tree for current directory in default format (txt)
node treeGenerator.js

# Generate tree for specific directory
node treeGenerator.js /path/to/project

# Generate tree for specific directory in JSON format
node treeGenerator.js /path/to/project --format json

# Generate directory-only tree (similar to rptree's -d flag)
node treeGenerator.js ./src -d

# Generate tree and save to specific file (similar to rptree's -o flag)
node treeGenerator.js ./src -o mytree.txt

# Generate tree with limited depth
node treeGenerator.js ./src --max-depth 5

# Generate tree showing file sizes and hidden files
node treeGenerator.js ./src --size --hidden

# Generate tree with file extensions filter
node treeGenerator.js ./src --extensions "js,ts,json"

# Generate tree with verbose output
node treeGenerator.js ./src --verbose

# Generate tree with emoji icons for folders and files
node treeGenerator.js ./src --use-emojis

# Generate tree without detailed headers/metadata
node treeGenerator.js ./src --no-headers

# Generate tree with headers/metadata (default behavior)
node treeGenerator.js ./src --headers

# Show version information
node treeGenerator.js -v

# Show help information
node treeGenerator.js -h

# Complex example with multiple flags
node treeGenerator.js ./my-project --format json --max-depth 3 --size --permissions --exclude ".git,node_modules" --extensions "js,ts,css,html" --use-emojis --headers
```

## Configuration Sources Priority

The script uses a three-tier configuration system with the following priority (highest to lowest):

1. **Command Line Arguments** (`process.argv[#]`): Highest priority
2. **Environment Variables** (`process.env.*`): Medium priority
3. **Config File** (`config.json`): Lowest priority (fallback)

### Configuration Variables

| Variable             | Environment Variable | Config Property      | Default Value                                         | Description                                         |
| -------------------- | -------------------- | -------------------- | ----------------------------------------------------- | --------------------------------------------------- |
| `OUTPUT_FILE`        | `OUTPUT_FILE`        | `OUTPUT_FILE`        | `'directory-structure'`                               | Base name for output files                          |
| `TAB`                | `TAB`                | `TAB`                | `'│   '`                                              | Indentation string for hierarchy                    |
| `BRANCH`             | `BRANCH`             | `BRANCH`             | `'├── '`                                              | Prefix for non-terminal items                       |
| `LAST_BRANCH`        | `LAST_BRANCH`        | `LAST_BRANCH`        | `'└── '`                                              | Prefix for terminal items                           |
| `EXCLUDE_FOLDERS`    | `EXCLUDE_FOLDERS`    | `EXCLUDE_FOLDERS`    | `['.git', 'node_modules', 'dist', 'build']`           | Folders to exclude from scan                        |
| `EXCLUDE_FILES`      | `EXCLUDE_FILES`      | `EXCLUDE_FILES`      | `['Desktop.ini', '*.tmp', '*.log', '*.bak', '*.swp']` | Files to exclude from scan (supports glob patterns) |
| [^1]                | `INPUT_DIR`          | `INPUT_DIR`          | `'.'`                                                 | Directory to scan                                   |
| `FORMAT`             | `FORMAT`             | `FORMAT`             | `'txt'`                                               | Output format                                       |
| `MAX_DEPTH`          | `MAX_DEPTH`          | `MAX_DEPTH`          | `10`                                                  | Maximum directory depth to traverse                 |
| `SHOW_HIDDEN`        | `SHOW_HIDDEN`        | `SHOW_HIDDEN`        | `false`                                               | Whether to show hidden files                        |
| `SHOW_SIZE`          | `SHOW_SIZE`          | `SHOW_SIZE`          | `false`                                               | Whether to show file sizes                          |
| `SHOW_PERMISSIONS`   | `SHOW_PERMISSIONS`   | `SHOW_PERMISSIONS`   | `false`                                               | Whether to show file permissions                    |
| `SHOW_LAST_MODIFIED` | `SHOW_LAST_MODIFIED` | `SHOW_LAST_MODIFIED` | `false`                                               | Whether to show last modified dates                 |
| `INCLUDE_EXTENSIONS` | `INCLUDE_EXTENSIONS` | `INCLUDE_EXTENSIONS` | `''`                                                  | Comma-separated file extensions to include          |
| `EXCLUDE_PATTERNS`   | `EXCLUDE_PATTERNS`   | `EXCLUDE_PATTERNS`   | `''`                                                  | Comma-separated patterns to exclude                 |
| `OUTPUT_PATH`        | `OUTPUT_PATH`        | `OUTPUT_PATH`        | `'./output'`                                          | Path for output files                               |
| `CREATE_SUBFOLDER`   | `CREATE_SUBFOLDER`   | `CREATE_SUBFOLDER`   | `false`                                               | Whether to create subfolder for output              |
| `VERBOSE`            | `VERBOSE`            | `VERBOSE`            | `false`                                               | Whether to show verbose output                      |
| `COLOR_OUTPUT`       | `COLOR_OUTPUT`       | `COLOR_OUTPUT`       | `false`                                               | Whether to enable color output                      |
| `MAX_FILE_SIZE`      | `MAX_FILE_SIZE`      | `MAX_FILE_SIZE`      | `10485760`                                            | Maximum file size to include in bytes               |
| `IGNORE_LIST`        | `IGNORE_LIST`        | `IGNORE_LIST`        | `['.DS_Store','Thumbs.db']`                           | Additional files to ignore                          |
| `USE_EMOJIS`         | `USE_EMOJIS`         | `USE_EMOJIS`         | `false`                                               | Whether to use emoji icons for folders and files    |
| `RESPECT_GITIGNORE`  | `RESPECT_GITIGNORE`  | `RESPECT_GITIGNORE`  | `false`                                               | Whether to respect rules in .gitignore file         |
| `HEADERS`            | `HEADERS`            | `HEADERS`            | `true`                                                | Whether to include detailed headers/metadata in output |

[^1]: Note: The input directory can be specified as the first positional argument to the script, or via environment variable or config property

## Output Format

### Text/Tree Format

The text format provides a visual representation of the directory structure with optional headers when enabled (default behavior). The headers include metadata about the generated tree such as version, generation timestamp, root directory, counts, and configuration details. Use `--no-headers` to suppress this metadata for cleaner output.

```text
==========================================================
Tree Directory Generator
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
│   │   ├── Header.js [1204 bytes]
│   │   └── Footer.js [856 bytes] [644] [08/19/2026]
│   └── index.js
└── package.json
```

### JSON Format

The JSON format provides a structured representation with comprehensive metadata when headers are enabled (default behavior). With `--no-headers`, only the tree structure is returned without metadata.

```json
{
  "metadata": {
    "name": "tree-directory-generator",
    "version": "1.0.0",
    "description": "A versatile JavaScript utility for generating visual representations of directory structures in multiple formats.",
    "author": "JaviRamosLab",
    "license": "MIT",
    "url": "https://javiramoslab.com/tree-directory-generator/",
    "docs": "https://javiramoslab.com/tree-directory-generator/docs",
    "schema": "https://javiramoslab.com/tree-directory-generator/schema",
    "generated": "2026-08-19T11:27:52.000Z",
    "generator": {
      "name": "tree-directory-generator",
      "version": "1.0.0",
      "platform": "win32",
      "nodeVersion": "v20.10.0"
    },
    "root": "/path/to/project",
    "stats": {
      "folders": 5,
      "files": 12,
      "size": 10240,
      "sizeFormatted": "10 KB",
      "outputFile": "directory-structure.json",
      "format": "JSON",
      "maxDepth": 10,
      "filters": "all files"
    },
    "config": {
      "showHidden": false,
      "showSize": false,
      "showPermissions": false,
      "showLastModified": false,
      "useEmojis": false,
      "respectGitignore": false,
      "includeExtensions": "",
      "excludeFolders": [".git", "node_modules", "dist", "build"],
      "excludePatterns": "",
      "dirOnlyMode": false,
      "maxFileSize": 10485760
    }
  },
  "tree": {
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
}
```

## Visual Symbols

The script uses the following symbols to represent the directory structure:

- `├──`: Used for items that have siblings below them
- `└──`: Used for the last item in a directory (terminal item)
- `│  `: Vertical connector for continuing the hierarchy

## Implementation Details

### Counting Algorithm

The script separates counting from output generation to ensure accurate folder and file counts in both CLI output and file output.

### Exclusion Logic

The exclusion logic prevents specified folders from appearing in the output, helping to reduce clutter from irrelevant directories like `.git` or build artifacts.

### Cross-Platform Compatibility

The script uses Node.js built-in modules (`fs`, `path`) to ensure compatibility across different operating systems.

## Customization

### Using Environment Variables

Create a `.env` file to configure the tool:

```env
OUTPUT_FILE=my_directory_structure
TAB=    # 4 spaces instead of │
BRANCH=|-- # Different branch character
EXCLUDE_FOLDERS=.git,node_modules,.cache,temp
EXCLUDE_FILES=*.log,*.tmp,*.bak
MAX_DEPTH=20
SHOW_SIZE=true
SHOW_HIDDEN=true
HEADERS=false  # Disable headers/metadata in output
```

### Using Config File

Edit `config/config.js` to configure the tool (note: the configuration file is now in JavaScript format rather than JSON for easier integration with the Node.js script):

```javascript
module.exports = {
  OUTPUT_FILE: "my_tree",
  TAB: "    ",
  BRANCH: "|-- ",
  EXCLUDE_FOLDERS: [".git", "node_modules", ".cache"],
  EXCLUDE_FILES: ["*.log", "*.tmp"],
  MAX_DEPTH: 15,
  SHOW_SIZE: true,
  SHOW_HIDDEN: true,
  HEADERS: false  // Disable headers/metadata in output
};
```

## Troubleshooting

### Common Issues

1. **Directory not found**: Ensure the specified directory exists and is accessible
2. **Permission denied**: Make sure you have read permissions for the directory
3. **Empty output**: Verify that the directory contains files/folders
4. **Missing minimatch**: Install dependencies with `npm install`
5. **Missing gitignore-parser**: Install with `npm install gitignore-parser` to enable .gitignore support
6. **Truncated symbols in environment variables**: Some terminals may truncate Unicode characters; ensure your environment properly supports Unicode symbols like │, ├, └

### Performance Considerations

- Large directory structures may take time to process
- Deeply nested structures may consume significant memory
- Excluding large folders (like `node_modules`) improves performance
- Setting lower MAX_DEPTH values improves performance
- Using file extension filters reduces processing time

## Integration

The script can be integrated into:

- Build processes
- Documentation generation workflows
- Repository analysis tools
- CI/CD pipelines

## Roadmap

### Planned Features

- **Color Output Support** (`COLOR_OUTPUT`): Add ANSI color codes for enhanced visual representation
- **File Size Threshold Filtering**: More sophisticated file size filtering beyond MAX_FILE_SIZE
- **Performance Optimization**: Multi-threading support for faster processing of large directories
- **Interactive Mode**: Interactive CLI mode with menu-driven options (inspired by Windows tool's guided setup wizard)
- **File Content Analysis**: Optional analysis of file content for more detailed reports
- **Export Formats**: Additional export formats (YAML, XML, HTML) (inspired by Windows tool's multiple output formats)
- **Progress Indicators**: Progress bar for large directory scans (inspired by Windows tool's progress updates)
- **Symbol Customization**: More flexible symbol customization options
- **Archive Support**: Ability to scan inside archive files (zip, tar, etc.)
- **Network Drives**: Enhanced support for network drives and remote filesystems
- **Real-time Monitoring**: Watch mode for monitoring directory changes in real-time
- **Plugin System**: Support for plugins to extend functionality
- **API Endpoint**: HTTP API endpoint for remote directory scanning
- **Graph Visualization**: Generate graph-based visualizations of directory structures
- **Dependency Analysis**: Analyze file dependencies and relationships
- **Directory-Only Mode**: Implement a dedicated directory-only output mode similar to rptree's `-d` option
- **Overwrite Safety**: Confirmation prompts before overwriting existing files (inspired by Windows tool's overwrite safety)
- **Hidden Items Support**: Better control over hidden/system files and folders (inspired by Windows tool)
- **Scriptable Automation**: Full parameter support for automation scripts (inspired by Windows tool's NonInteractive mode)
- **Restart Loop**: Option to restart the generation process (inspired by Windows tool's restart feature)
- **NPM Package**: Package for global npm installation with `npm install -g tree-directory-generator`
- **CI/CD Integration**: GitHub Actions workflow for automated testing and publishing
- **Gitignore Support**: Respect rules in .gitignore file when excluding files and folders
- **Emoji Support**: Add customizable emoji icons for folders and files (e.g.,📁 for folders,📄 for files)
- **Default Gitignore Entries**: Automatically add `/data/` and `/output/` directories, and personalized user `config.json` to .gitignore

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for your changes (if applicable)
5. Run the test suite (`npm test`)
6. Commit your changes using conventional commits format
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### GitHub Actions Workflows

This project uses two GitHub Actions workflows:

- **CI Workflow** (`.github/workflows/ci.yml`): Runs on every push and pull request to test the code across multiple Node.js versions
- **Release Workflow** (`.github/workflows/release.yml`): Runs on pushes to main branch to automatically publish new versions to npm (requires `NPM_TOKEN` secret)

## License

This script is open source and available under the MIT License.
