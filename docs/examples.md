# Tree Generator Examples

This document provides comprehensive examples of how to use the Directory Tree Generator with various configurations and options.

## Basic Usage

### Generate tree for current directory
```bash
node treeGenerator.js
```

### Generate tree for specific directory
```bash
node treeGenerator.js /path/to/project
```

## Format Options

### Generate in JSON format
```bash
node treeGenerator.js ./my-project --format json
```

### Generate in tree format
```bash
node treeGenerator.js ./my-project --format tree
```

### Generate in default text format
```bash
node treeGenerator.js ./my-project --format txt
```

## Depth Control

### Limit tree depth to 3 levels
```bash
node treeGenerator.js ./src --max-depth 3
```

### Unlimited depth (default is 10)
```bash
node treeGenerator.js ./large-project --max-depth 15
```

## File and Folder Filtering

### Exclude specific folders
```bash
node treeGenerator.js ./my-project --exclude ".git,node_modules,dist"
```

### Include only specific file extensions
```bash
node treeGenerator.js ./src --extensions "js,ts,json"
```

### Directory-only tree (no files)
```bash
node treeGenerator.js ./my-project -d
```

## Advanced Filtering

### Exclude files by pattern
```bash
node treeGenerator.js ./project --exclude-patterns "*.log,*.tmp,*.bak"
```

### Maximum file size filter (10MB limit)
```bash
node treeGenerator.js ./media --max-file-size 10485760
```

## Metadata Display

### Show file sizes
```bash
node treeGenerator.js ./data --size
```

### Show file permissions
```bash
node treeGenerator.js ./scripts --permissions
```

### Show last modified dates
```bash
node treeGenerator.js ./documents --modified
```

### Show hidden files
```bash
node treeGenerator.js ./home --hidden
```

## Output Configuration

### Save to specific file
```bash
node treeGenerator.js ./src -o my-tree.txt
```

### Create output in subfolder
```bash
node treeGenerator.js ./project --output-path ./output --subfolder
```

## Combined Examples

### Full-featured example
```bash
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
```

### Documentation-focused example
```bash
node treeGenerator.js ./docs \
  --exclude ".git,*.tmp,*.log" \
  --extensions "md,txt,rst" \
  --size \
  --hidden \
  --max-depth 4 \
  -o documentation-map.txt
```

### Code project example
```bash
node treeGenerator.js ./src \
  --format tree \
  --exclude ".git,node_modules,dist,coverage" \
  --extensions "js,ts,jsx,tsx,css,scss,html,json" \
  --size \
  --max-depth 6 \
  --exclude-patterns "test.*,spec.*" \
  -o code-structure.tree
```

## Environment Variable Examples

### Using environment variables
```bash
# Set environment variables
export FORMAT=json
export MAX_DEPTH=5
export EXCLUDE_FOLDERS=".git,node_modules,dist"
export SHOW_SIZE=true

# Run the generator
node treeGenerator.js ./my-project
```

## Configuration File Examples

### Using config file (config/config.js)
Create a `config/config.js` file with:
```javascript
module.exports = {
  FORMAT: "json",
  MAX_DEPTH: 7,
  EXCLUDE_FOLDERS: [".git", "node_modules", "dist", "build"],
  SHOW_SIZE: true,
  SHOW_PERMISSIONS: false,
  SHOW_LAST_MODIFIED: true,
  INCLUDE_EXTENSIONS: "js,ts,json,md",
  EXCLUDE_PATTERNS: "*.log,*.tmp",
  OUTPUT_PATH: "./output",
  CREATE_SUBFOLDER: true
};
```

Then run:
```bash
node treeGenerator.js ./my-project
```

## Verbose and Debug Examples

### Verbose output
```bash
node treeGenerator.js ./project --verbose
```

### Get version information
```bash
node treeGenerator.js --version
```

### Get help
```bash
node treeGenerator.js --help
```

## Practical Use Cases

### Web development project
```bash
node treeGenerator.js ./frontend \
  --format tree \
  --exclude ".git,node_modules,dist,.next,out" \
  --extensions "js,ts,jsx,tsx,css,scss,html,json,md" \
  --size \
  --max-depth 4 \
  -o frontend-structure.tree
```

### Backend API project
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

### Documentation site
```bash
node treeGenerator.js ./docs-site \
  --exclude ".git,node_modules,.vuepress/.cache,.vuepress/dist" \
  --extensions "md,vue,js,ts,css" \
  --hidden \
  --max-depth 3 \
  -o docs-structure.txt
```
