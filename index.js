#!/usr/bin/env node
import { Command } from 'commander';

import { DependencyAnalyzer } from './DependencyAnalyzer.js';
import { PackageAnalyzer } from './PackageAnalyzer.js';
import { TreeVisualizer } from './TreeVisualizer.js';

const program = new Command();

program
  .name('trivial-tool')
  .description('A CLI tool to analyze and visualize node trivial package on dependencies chain')
  .version('1.0.0');

// tree <package> : for print dependencies tree
const treeCommand = program
  .command('tree')
  .description('Print the dependency tree of a package');

// Attach the argument to the 'treeCommand' instance
treeCommand
  .argument('[package]', 'package name to analyze (blank = all)')
  .action((pkgName) => {
    const analyzer = new TreeVisualizer(pkgName || '');
    analyzer.printTree();
  });

// pathList <package> : for print path of file that use to count 
const  pathListCommand = program
  .command('pathlist')
  .description('Lists file paths used to detect trivial packages.')
pathListCommand
  .argument('[package]', 'package name to analyze (blank = all)')
  .action((pkgName) => {
    const analyzer = new PackageAnalyzer(pkgName || '',);
    const path = analyzer.getFilesPath()
    console.log(path);
  });

// analyze <package> : analyze the package and its dependencies
const  analyzeCommand = program
  .command('analyze')
  .description('Analyze the package and its dependencies.')
analyzeCommand
  .argument('[package]', 'package name to analyze (blank = all)')
  .action((pkgName) => {
    const analyzer = new PackageAnalyzer(pkgName || '',);
    const result = analyzer.analyzePackages()
    console.log(result);
  });

program.parse();