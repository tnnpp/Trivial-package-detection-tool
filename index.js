#!/usr/bin/env node
import { Command } from 'commander';
import { dependencies_tree } from "./dependency_chain/dependencies_tree.js";
import { dependencies_path } from './dependency_chain/dependencies_path.js';
import { analyze } from './detect/analyze.js';
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
    const name = pkgName || ''; 
    dependencies_tree(name);
  });

// pathList <package> : for print path of file that use to count 
const  pathListCommand = program
  .command('pathlist')
  .description('Lists file paths used to detect trivial packages.')
pathListCommand
  .argument('[package]', 'package name to analyze (blank = all)')
  .action((pkgName) => {
    const name = pkgName || ''; 
    const path = dependencies_path(name)
    console.log(path)
  });

// analyze <package> : analyze the package and its dependencies
const  analyzeCommand = program
  .command('analyze')
  .description('Analyze the package and its dependencies.')
analyzeCommand
  .argument('[package]', 'package name to analyze (blank = all)')
  .action((pkgName) => {
    const name = pkgName || ''; 
    const result = analyze(name)
    console.log(result)
  });

program.parse();