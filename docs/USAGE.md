# Usage Guide

## Requirements

- **Runtime:** Node.js 12+
- **OS:** Cross-platform (Windows, macOS, Linux)

Install Node.js from [nodejs.org](https://nodejs.org/) if not already installed.

Confirm the install:

```bash
node --version
npm --version
```

---

## Quick Start

1. Navigate to the project directory containing `treeGenerator.js`
2. Install dependencies:

   ```bash
   npm install
   npm install minimist dotenv minimatch
   ```

3. Run the tree generator:

   ```bash
   node treeGenerator.js
   ```

---

## Command Line Interface

The tree generator supports various command-line flags to customize the output:

### Basic Usage

```bash
node treeGenerator.js [options] [directory]
```

### Options

| Flag                  | Alias | Description                                        | Default                        |
| --------------------- | ----- | -------------------------------------------------- | ------------------------------ |
| `-h`, `--help`        |       | Show help message                                  |                                |
| `-v`, `--version`     |       | Show version information                           |                                |
| `-d`, `--dir-only`    |       | Generate directory-only tree diagram               |                                |
| `-o`, `--output-file` |       | Save output to a file                              | `directory-structure`          |
| `--format`            |       | Output format (txt, tree, json)                    | `txt`                          |
| `--max-depth`         |       | Maximum directory depth to traverse                | `10`                           |
| `--hidden`            |       | Show hidden files                                  | `false`                        |
| `--size`              |       | Show file sizes                                    | `false`                        |
| `--permissions`       |       | Show file permissions                              | `false`                        |
| `--modified`          |       | Show last modified dates                           | `false`                        |
| `--extensions`        |       | Comma-separated list of file extensions to include |                                |
| `--exclude`           |       | Comma-separated list of folders to exclude         | `.git,node_modules,dist,build` |
| `--exclude-patterns`  |       | Comma-separated list of patterns to exclude        |                                |
| `--output-path`       |       | Path for output files                              | `./output`                     |
| `--subfolder`         |       | Create subfolder for output                        | `false`                        |
| `--verbose`           |       | Show verbose output                                | `false`                        |
| `--color`             |       | Enable color output                                | `false`                        |
| `--max-file-size`     |       | Maximum file size to include in bytes              | `10485760`                     |
| `--tab`               |       | String for indentation                             | `│   `                         |
| `--branch`            |       | String for non-terminal items                      | `├── `                         |
| `--last-branch`       |       | String for terminal items                          | `└── `                         |
| `--ignore`            |       | Additional files to ignore                         | `.DS_Store,Thumbs.db`          |

### Examples

#### Basic Commands

```bash
# Generate tree for current directory
node treeGenerator.js

# Generate tree for specific directory
node treeGenerator.js /path/to/project

# Generate tree for specific directory
node treeGenerator.js ./my-project
```

#### Format Options

```bash
# Generate in JSON format
node treeGenerator.js ./my-project --format json

# Generate in tree format
node treeGenerator.js ./my-project --format tree

# Generate in default text format
node treeGenerator.js ./my-project --format txt
```

#### Depth Control

```bash
# Limit tree depth to 3 levels
node treeGenerator.js ./src --max-depth 3

# Unlimited depth (default is 10)
node treeGenerator.js ./large-project --max-depth 15
```

#### Filtering Options

```bash
# Exclude specific folders
node treeGenerator.js ./my-project --exclude ".git,node_modules,dist"

# Include only specific file extensions
node treeGenerator.js ./src --extensions "js,ts,json"

# Directory-only tree (no files)
node treeGenerator.js ./my-project -d

# Exclude files by pattern
node treeGenerator.js ./project --exclude-patterns "*.log,*.tmp,*.bak"
```

#### Metadata Display

```bash
# Show file sizes
node treeGenerator.js ./data --size

# Show file permissions
node treeGenerator.js ./scripts --permissions

# Show last modified dates
node treeGenerator.js ./documents --modified

# Show hidden files
node treeGenerator.js ./home --hidden
```

#### Output Configuration

```bash
# Save to specific file
node treeGenerator.js ./src -o my-tree.txt

# Create output in subfolder
node treeGenerator.js ./project --output-path ./output --subfolder

# Maximum file size filter (5MB limit)
node treeGenerator.js ./media --max-file-size 5242880
```

#### Combined Examples

```bash
# Full-featured example
node treeGenerator.js ./complex-project \
  --format json \
  --max-depth 5 \
  --size \
  --permissions \
  --modified \
  --exclude ".git,node_modules,dist,build" \
  --extensions "js,ts,jsx,tsx,json,md" \
  --exclude-patterns "*.log,*.tmp,*.bak" \
  --max-file-size 5242880 \
  -o project-structure.json

# Documentation-focused example
node treeGenerator.js ./docs \
  --exclude ".git,*.tmp,*.log" \
  --extensions "md,txt,rst" \
  --size \
  --hidden \
  --max-depth 4 \
  -o documentation-map.txt

# Code project example
node treeGenerator.js ./src \
  --format tree \
  --exclude ".git,node_modules,dist,coverage" \
  --extensions "js,ts,jsx,tsx,css,scss,html,json" \
  --size \
  --max-depth 6 \
  --exclude-patterns "test.*,spec.*" \
  -o code-structure.tree
```

#### Verbose and Information

```bash
# Verbose output
node treeGenerator.js ./project --verbose

# Get version information
node treeGenerator.js --version

# Get help
node treeGenerator.js --help
```

---

## Configuration Sources Priority

The script uses a three-tier configuration system with the following priority (highest to lowest):

1. **Command Line Arguments** (`process.argv[#]`): Highest priority
2. **Environment Variables** (`process.env.*`): Medium priority
3. **Config File** (`config/config.js`): Lowest priority (fallback)

### Environment Variables

Create a `.env` file to configure the tool:

```env
# Basic configuration
OUTPUT_FILE=my_directory_structure
FORMAT=json
MAX_DEPTH=15

# Visual appearance
TAB=│
BRANCH=├──
LAST_BRANCH=└──

# Exclusions
EXCLUDE_FOLDERS=.git,node_modules,.cache,temp
EXCLUDE_FILES=*.log,*.tmp,*.bak
EXCLUDE_PATTERNS=*test*,*spec*

# Filters
INCLUDE_EXTENSIONS=js,ts,json,md
MAX_FILE_SIZE=5242880

# Output
OUTPUT_PATH=./output
SHOW_SIZE=true
SHOW_HIDDEN=true
SHOW_PERMISSIONS=false
SHOW_LAST_MODIFIED=false
VERBOSE=true
COLOR_OUTPUT=false

# Other
IGNORE_LIST=.DS_Store,Thumbs.db,*.tmp
```

### Config File

Create `config/config.js` to configure the tool:

```javascript
module.exports = {
  OUTPUT_FILE: "my_tree",
  FORMAT: "json",
  MAX_DEPTH: 15,
  TAB: "    ", // 4 spaces instead of │
  BRANCH: "|-- ", // Different branch character
  LAST_BRANCH: "`-- ", // Different last branch character
  EXCLUDE_FOLDERS: [".git", "node_modules", ".cache", "temp"],
  EXCLUDE_FILES: ["*.log", "*.tmp", "*.bak"],
  INCLUDE_EXTENSIONS: "js,ts,json,md,html,css",
  EXCLUDE_PATTERNS: "*test*,*spec*",
  OUTPUT_PATH: "./output",
  SHOW_SIZE: true,
  SHOW_HIDDEN: true,
  SHOW_PERMISSIONS: false,
  SHOW_LAST_MODIFIED: false,
  MAX_FILE_SIZE: 5242880, // 5MB
  VERBOSE: true,
  COLOR_OUTPUT: false,
  IGNORE_LIST: [".DS_Store", "Thumbs.db", "*.tmp"],
};
```

---

## Output Formats

### Text/Tree Format

The text format provides a visual representation of the directory structure:

```text
==========================================================
Directory Tree Generator
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

---

## Visual Symbols

The script uses the following symbols to represent the directory structure:

- `├──`: Used for items that have siblings below them
- `└──`: Used for the last item in a directory (terminal item)
- `│  `: Vertical connector for continuing the hierarchy

---

## Practical Use Cases

### Web Development Project

```bash
node treeGenerator.js ./frontend \
  --format tree \
  --exclude ".git,node_modules,dist,.next,out" \
  --extensions "js,ts,jsx,tsx,css,scss,html,json,md" \
  --size \
  --max-depth 4 \
  -o frontend-structure.tree
```

### Backend API Project

```bash
node treeGenerator.js ./backend \
  --format json \
  --exclude ".git,node_modules,dist,__pycache__,*.pyc" \
  --extensions "js,ts,json,yml,yaml,env" \
  --size \
  --permissions \
  --max-depth 5 \
  -o backend-api-structure.json
```

### Documentation Site

```bash
node treeGenerator.js ./docs-site \
  --exclude ".git,node_modules,.vuepress/.cache,.vuepress/dist" \
  --extensions "md,vue,js,ts,css" \
  --hidden \
  --max-depth 3 \
  -o docs-structure.txt
```

---

## Troubleshooting

### Common Issues

| Problem                              | Solution                                                |
| ------------------------------------ | ------------------------------------------------------- |
| `node` command not found             | Install Node.js from [nodejs.org](https://nodejs.org/)  |
| `minimist` module not found          | Run `npm install minimist dotenv minimatch`             |
| Directory not found                  | Ensure the specified directory exists and is accessible |
| Permission denied                    | Make sure you have read permissions for the directory   |
| Empty output                         | Verify that the directory contains files/folders        |
| Missing dependencies                 | Run `npm install` in the project directory              |
| Trailing spaces trimmed in .env file | Quote values in .env: `TAB="│   "`                      |

### Performance Considerations

- Large directory structures may take time to process
- Deeply nested structures may consume significant memory
- Excluding large folders (like `node_modules`) improves performance
- Setting lower MAX_DEPTH values improves performance
- Using file extension filters reduces processing time

---

## Tips

- Exclude heavy folders (`node_modules`, `.git`, `dist`, `build`) for faster scans
- Use `--max-depth 2` or `3` for a high-level overview
- Combine multiple flags for complex configurations
- Use environment variables for persistent settings
- Use config files for project-specific configurations
- The `-d` flag generates directory-only trees (similar to Unix `tree -d`)
- The `--size` flag helps identify large files in your project
