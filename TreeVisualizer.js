import fs from 'fs';
import path from 'path';
import { DependencyAnalyzer } from './DependencyAnalyzer.js';
import { PackageAnalyzer } from './PackageAnalyzer.js';

// ANSI code
const RESET = '\x1b[0m';
const BLUE = '\x1b[34m';

export class TreeVisualizer {
  constructor(name, baseDir = process.cwd()) {
    this.name = name;
    this.baseDir = baseDir;
    this.packageAnalyzer = new PackageAnalyzer(name, baseDir);
    this.analyzed = this.packageAnalyzer.detectTriviality()
  }

 

  buildTree() {
    const chains = this.packageAnalyzer.dependencyAnalyzer.getDependencyChains();
    const root = {};
    console.log("============================================================")
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
      const resultEntry = this.analyzed.result[name];
      const is_trivial = resultEntry ? resultEntry.is_trivial : null;

      if (name == ''){
        name = this.baseDir
      }
      if (is_trivial == 'trivial'){
        console.error(indent + (isLast ? '└── ' : '├── ') + name + "  " + this.analyzed.result[name]['is_trivial']);
      } else if  (is_trivial == 'data package'){
        console.warn(indent + (isLast ? '└── ' : '├── ') + name + "  " + this.analyzed.result[name]['is_trivial']);
      } else if  (is_trivial == 'unknown'){
        console.log(BLUE + indent + (isLast ? '└── ' : '├── ') + name + "  " + this.analyzed.result[name]['is_trivial'] + RESET);
      } else if  (is_trivial == null){
        console.log(indent + (isLast ? '└── ' : '├── ') + name + "  " );
      }  else {
        console.log(indent + (isLast ? '└── ' : '├── ') + name + "  " + this.analyzed.result[name]['is_trivial']);
      }
      const newIndent = indent + (isLast ? '    ' : '│   ');
      this.printTree(subtree, newIndent, last);
    });
  }
}
