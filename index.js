#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { PackageAnalyzer } from './PackageAnalyzer.js';
import { TreeVisualizer } from './TreeVisualizer.js';

const program = new Command();

program
  .name('trivial-tool')
  .description('A CLI tool to analyze and visualize node trivial package on dependencies chain')
  .version('1.0.0');

// tree <package> : for print dependencies tree
const scanCommand = program
  .command('scan')
  .description('Print the dependency tree of a package');

// Attach the argument to the 'treeCommand' instance
scanCommand
  .argument('[package]', 'package name to analyze (blank = all)')
  .option('-j, --json', 'Output result as JSON')
  .action((pkgName, options) => {
    const analyzer = new TreeVisualizer(pkgName || '');
    if (options.json){
      const result = analyzer.packageAnalyzer.detectTriviality()
      console.log(result)

      const fileName = pkgName ? `${pkgName}-trivial-analysis.json` : 'all-trivial-analysis.json';
      const filePath = path.resolve(process.cwd(), fileName);
      // Write JSON file with pretty print
      fs.writeFileSync(filePath, JSON.stringify(result, null, 4), 'utf-8');
      
      console.log(`Result written to ${filePath}`);
    } else {
      analyzer.printTree();
    }
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
  .option('-j, --json', 'Output result as JSON')
  .action((pkgName, options) => {
    const analyzer = new PackageAnalyzer(pkgName || '',);
    const result = analyzer.analyzePackages()
    console.log(result);
    if (options.json){
      const fileName = pkgName ? `${pkgName}-analysis.json` : 'all-analysis.json';
      const filePath = path.resolve(process.cwd(), fileName);

      // Write JSON file with pretty print
      fs.writeFileSync(filePath, JSON.stringify(result, null, 4), 'utf-8');
      
      console.log(`Result written to ${filePath}`);
    } 
  });



program.parse();