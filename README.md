# Trivial Package Detection Tool

A CLI tool to analyze Node.js packages and their dependencies, classify them as *trivial*, *data*, or *normal*, and generate reports (with optional JSON output and dependency tree visualization).

---

## Features

- Walks through a package’s dependency graph  
- Measures:
  - Lines of code (`loc`) for each dependency using **cloc**
  - Cyclomatic complexity + number of functions/methods per module using **typhonjs-escomplex**
  - Vulnerabilities via `npm audit`
  - Number of import/require lines, presence of other languages, number of files etc.  
- Classifies each dependency into one of:
  1. **Trivial** — small, simple packages  
  2. **Data package** — minimal logic, mostly data  
  3. **Normal** — anything else  
  4. (Implicit) *Unknown* — if analysis couldn’t be performed reliably  
- Outputs in console or JSON  
- Can write report files automatically

---

## Prerequisites

- **Node.js** (v14+ recommended)  
- **npm**  
- `cloc` installed in your PATH (for counting lines of code)  
  - On many systems: `npm install -g cloc` or via your OS package manager  

---

## Installation

1. Clone the repo

git clone https://github.com/tnnpp/Trivial-package-detection-tool.git

2. Change into tool directory
```cd Trivial-package-detection-tool```

3. Install dependencies
```npm install```

4. make CLI usable globally:
```npm link```

## How to use
1. Navigate into your npm project directory.
2. Run the available commands.

## Available Commands

### `trivial-tool scan [package]`
Analyze and detect a package and print its dependency tree.  
If no package is provided, analyzes **all dependencies**.

**Options:**
- `-j, --json` : Output result as JSON and write to a file (`<package>-trivial-analysis.json` or `all-trivial-analysis.json`).
- [package] = "" : Scan all package in project


### `trivial-tool scanOne [package]`
Analyze and only selected package

**Options:**
- `--json` : Output result as JSON and write to a file (`<package>-trivial-analysis.json` or `all-trivial-analysis.json`).


### `trivial-tool pathlist [package]`
Lists file paths used to detect trivial packages.

**Options:**
- `-j, --json` : Output result as JSON and write to a file (`<package>-trivial-analysis.json` or `all-trivial-analysis.json`).
- [package] = "" : Scan all package in project


### `trivial-tool analyze [package]`
Print measurements and analyze each collected metric of a package (or all dependencies if omitted) in JSON form.
Includes LOC, cyclomatic complexity, number of functions, vulnerabilities, import count, etc.

**Options:**
- [package] = "" : Scan all package in project

### `trivial-tool chain [package]`
Print the full dependency chains of a package.

**Options:**
- [package] = "" : Scan all package in project


