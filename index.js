#!/usr/bin/env node
import { Command } from 'commander';
import { dependencies_tree } from "./dependency_chain/dependencies_tree.js";
import { dependencies_path } from './dependency_chain/dependencies_path.js';
import { Analyze } from './detect/Analyze.js';
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
  .argument('<package>', 'package name to analyze')
  .action((pkgName) => {
    dependencies_tree(pkgName)
  });

// pathList <package> : for print path of file that use to count 
const  pathListCommand = program
  .command('pathList')
  .description('Lists file paths used to detect trivial packages.')
pathListCommand
  .argument('<package>', 'package name to analyze')
  .action((pkgName) => {
    const path = dependencies_path(pkgName)
    console.log(path)
  });

// analyze <package> : analyze the package and its dependencies
const  analyzeCommand = program
  .command('analyze')
  .description('Analyze the package and its dependencies.')
analyzeCommand
  .argument('<package>', 'package name to analyze')
  .action((pkgName) => {
    const analyze = Analyze(pkgName)
    console.log(analyze)
  });

program.parse();