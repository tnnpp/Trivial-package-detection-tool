#!/usr/bin/env node
import { Command } from 'commander';
import { dependencies_tree } from "./dependency_chain/dependencies_tree.js";

const program = new Command();

program
  .name('trivial-tool')
  .description('A CLI tool to analyze and visualize node trivial package on dependencies chain')
  .version('1.0.0');

const treeCommand = program
  .command('tree')
  .description('Print the dependency tree of a package');

// Attach the argument to the 'treeCommand' instance
treeCommand
  .argument('<package>', 'package name to analyze')
  .action((pkgName) => {
    dependencies_tree(pkgName)
  });

program.parse();
