#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { PackageAnalyzer } from './PackageAnalyzer.js';
import { TreeVisualizer } from './TreeVisualizer.js';
import { DependencyAnalyzer } from './DependencyAnalyzer.js';

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
    const risk = analyzer.RiskAnalyze()
    // --json
    if (options.json){
      const result = analyzer.analyzed
      console.log(result)
      result['risk_package'] = risk
      const safeName = pkgName.replace(/[\/@]/g, '_');
      const fileName = safeName ? `${safeName}-trivial-analysis.json` : 'all-trivial-analysis.json';
      const filePath = path.resolve(process.cwd(), fileName);
      // Write JSON file with pretty print
      fs.writeFileSync(filePath, JSON.stringify(result, null, 4), 'utf-8');
      
      console.log(`Result written to ${filePath}`);
    } else {
      const { result, trivial, data, normal } = analyzer.analyzed;
      const total = Object.keys(result).length;
      const error = total - (trivial + data + normal)
      analyzer.printTree();
      
      console.log(`Trivial Package founded: ${trivial}/${total} (${((trivial/total)*100).toFixed(2)}%)`)
      console.log(`data Package founded: ${data}/${total} (${((data/total)*100).toFixed(2)}%)`)
      if (error != 0) {
        console.error(`Detect Error: ${error}/${total} (${((error/total)*100).toFixed(2)}%)`)
      }
      if (risk){
        console.log(`Risk package:`, risk);
      }
    }
  });

const scanOneCommand = program
  .command('scanOne')
  .description('Print the dependency tree of a package');
scanOneCommand
  .argument('[package]', 'package name to analyze (blank = all)')
  .action((pkgName, options) => {
    if (pkgName != ""){
      const analyzer = new PackageAnalyzer(pkgName)
      const result = analyzer.detectTriviality(pkgName)
      const safeName = pkgName.replace(/[\/@]/g, '_');
      const fileName = safeName ? `${safeName}-trivial-analysis.json` : 'all-trivial-analysis.json';
      const filePath = path.resolve(process.cwd(), fileName);

      fs.writeFileSync(filePath, JSON.stringify(result, null, 4), 'utf-8');
      console.log(result)
    }else {
      console.log("Please enter package name")
    }

  })
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
    // analyzer.RiskAnalyze()
    if (options.json){
      const fileName = pkgName ? `${pkgName}-analysis.json` : 'all-analysis.json';
      const filePath = path.resolve(process.cwd(), fileName);

      // Write JSON file with pretty print
      fs.writeFileSync(filePath, JSON.stringify(result, null, 4), 'utf-8');
      
      console.log(`Result written to ${filePath}`);

    } 
  });

  const chainCommand = program
    .command('chain')
    .description("Get package's dependencies chain.")
  chainCommand
    .argument('[package]', 'package name to analyze (blank = all)')
    .action((pkgName) =>{
      const dependencyAnalyzer = new DependencyAnalyzer(pkgName || '');
      console.log(dependencyAnalyzer.getDependencyChains())
    }
    )


program.parse();