import fs from 'fs';
import path from 'path';

export class DependencyAnalyzer {
  constructor(name, baseDir = process.cwd()) {
    this.name = name;
    this.baseDir = baseDir;
    this.visited = new Set();
    this.packageChains = [];
  }

  resolveChain(name = this.name, currentPkg = []) {
    const key = `${currentPkg.join('>')}>${name}`;
    if (this.visited.has(key)) return;
    this.visited.add(key);

    let modulePath = path.join(this.baseDir, 'node_modules', name);
    let jsonPath = path.join(modulePath, 'package.json');

    if (name === "") {
      jsonPath = path.join(this.baseDir, 'package.json');
    }

    if (!fs.existsSync(jsonPath)) return;

    let pkg;
    try {
      pkg = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    } catch (error) {
      console.error("Failed to read package.json:", error);
      return;
    }

    const nextPkg = [...currentPkg, name];
    const deps = pkg.dependencies ? Object.keys(pkg.dependencies) : [];

    if (deps.length === 0) {
      this.packageChains.push(nextPkg);
      return;
    }

    for (const dep of deps) {
      this.resolveChain(dep, nextPkg);
    }

    if (deps.length === 0) {
      this.packageChains.push(nextPkg);
    }
  }

  getDependencyChains() {
    if (this.packageChains.length === 0) {
      this.resolveChain();
    }
    return this.packageChains;
  }

  getDependencyCount() {
    const chains = this.getDependencyChains();
    const depSet = new Set();
    for (const chain of chains) {
      for (const dep of chain) {
        depSet.add(dep);
      }
    }
    return {
      size: depSet.size,
      dependencies: depSet,
    };
  }

  buildTree() {
    const chains = this.getDependencyChains();
    const root = {};
    for (const chain of chains) {
      let current = root;
      for (const name of chain) {
        if (!current[name]) current[name] = {};
        current = current[name];
      }
    }
    return root;
  }

  printTree(tree = this.buildTree(), indent = '', isLast = true) {
    const entries = Object.entries(tree);
    entries.forEach(([name, subtree], idx) => {
      const last = idx === entries.length - 1;
      console.log(indent + (isLast ? '└── ' : '├── ') + name);
      const newIndent = indent + (isLast ? '    ' : '│   ');
      this.printTree(subtree, newIndent, last);
    });
  }
}
