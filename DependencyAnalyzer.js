import fs from 'fs';
import path from 'path';

export class DependencyAnalyzer {
  constructor(name, baseDir = process.cwd()) {
    this.name = name;
    this.baseDir = baseDir;
    this.visited = new Set();
    this.packageChains = [];
    this.dependencyMap = new Map();
  }

  resolveChain(name = this.name, currentPkg = []) {
    if (this.visited.has(name)) return;;
    

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
    this.visited.add(name);
    const deps = pkg.dependencies ? Object.keys(pkg.dependencies) : [];
    this.dependencyMap.set(name, new Set(deps));

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

  getDependencyMapCount() {
    const result = {};
    for (const [pkg, depSet] of this.dependencyMap.entries()) {
      console.log(pkg)
      result[pkg] = depSet.size;
    }
    return result;
  }
}
