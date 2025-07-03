import fs from 'fs';
import { execSync } from 'child_process';
import escomplex from 'typhonjs-escomplex';
import { DependencyAnalyzer } from './DependencyAnalyzer.js';
import { globSync } from 'glob';

const CLOC_PATH = 'cloc';

export class PackageAnalyzer {
  constructor(pkgName = '', baseDir = process.cwd()) {
    this.pkgName = pkgName;
    this.baseDir = baseDir;
    this.dependencyAnalyzer = new DependencyAnalyzer(pkgName, baseDir);
  }

  getFilesPath() {
    const dependencies = this.dependencyAnalyzer.getDependencyCount()
    const dependencyList = dependencies.dependencies;
    const folderMap = {};
    //  handle all case     
    if (this.pkgName == ''){
        dependencyList.delete('');
    }
    for (const depName of dependencyList) {
        let file = globSync(`node_modules/${depName}/**/*.{js,ts,cjs,cts,mjs,mts,tsx,jsx}`, {
            nodir: true,
            ignore: [
            '**/test/**',
            '**/tests/**',
            '**/__tests__/**',
            '**/test-utils/**',
            '**/*.spec.*',
            '**/*.test.*',
            '**/*.d.ts',
            '**/dist/**',
            '**/build/**',
            '**/coverage/**',
            '**/example/**',
            '**/examples/**',
            '**/docs/**',
            '**/*.config.js',
            '**/*.config.cjs',
            '**/*.config.ts',
            '**/*.config.tjs',
            ]
        });
       
        // fallback: no file found
        if (file.length === 0) {
            file = globSync(`node_modules/${depName}/**/*.{js,ts,cjs,cts,mjs,mts,tsx,jsx}`, {
            nodir: true,
            ignore: [
                '**/test/**',
                '**/tests/**',
                '**/__tests__/**',
                '**/test-utils/**',
                '**/*.spec.*',
                '**/*.test.*',
                '**/*.d.ts',
                '**/coverage/**',
                '**/example/**',
                '**/examples/**',
                '**/docs/**',
                '**/*.config.js',
                '**/*.config.cjs',
                '**/*.config.ts',
                '**/*.config.tjs',
            ]
            });
        }
    
        if (file.length === 0){
               folderMap[depName] = []
           } 
        else{
           folderMap[depName] = file;
        }
    }

    return folderMap;
    }

  cloc(filePaths, pkgName) {
    try {
      const fileList = filePaths.map(f => `"${f}"`).join(' ');
      const clocCmd = `${CLOC_PATH} ${fileList} --json`;
      const clocOutput = execSync(clocCmd);
      const clocResult = JSON.parse(clocOutput);
      return clocResult.SUM?.code || 0;
    } catch {
      try {
        const clocCmd = `${CLOC_PATH} node_modules/${pkgName} --include-lang=JavaScript,TypeScript --exclude-ext=d.ts --json`;
        const clocOutput = execSync(clocCmd);
        const clocResult = JSON.parse(clocOutput);
        return clocResult.SUM?.code || 0;
      } catch {
        console.warn("fail to count LOC for", pkgName);
        return -1;
      }
    }
  }

  complexity(filePaths) {
    try {
      const projectFiles = filePaths.map(p => ({
        srcPath: p,
        code: fs.readFileSync(p, 'utf-8'),
      }));
      const results = escomplex.analyzeProject(projectFiles);
      const complexity = results.modules.reduce((sum, mod) => sum + (mod.aggregate?.cyclomatic || 0), 0);
      const methodCount = results.modules.reduce((sum, mod) => sum + (mod.methods?.length || 0), 0);
      const classMethods = results.modules.reduce((sum, mod) => {
        return sum + (mod.classes?.reduce((innerSum, cls) => innerSum + (cls.methods?.length || 0), 0) || 0);
      }, 0);
      return {
        complexity,
        function: methodCount + classMethods
      };
    } catch {
      return { complexity: -1, function: -1 };
    }
  }

  analyzePackages() {
    const results = []
    const filePath = this.getFilesPath()
    for (const pkg in filePath){
        const loc = this.cloc(filePath[pkg], pkg);
        const complex = this.complexity(filePath[pkg]);
        if (complex['complexity'] == -1) {
            console.warn('can not find complexity of : ', pkg)
        }
        results.push({
            package: pkg,
            cloc: loc,
            complexity: complex['complexity'],
            function: complex['function']
        })
    }
    return results

  }

  detectTriviality() {
    const pkgs = this.analyzePackages();
    let trivial = 0, dataTrivial = 0, nonTrivial = 0;

    for (const pkg of pkgs) {
      if (pkg.cloc === -1 || pkg.complexity === -1 || pkg.function === -1) {
        pkg['is_trivial'] = 'unknown';
        continue;
      }

      if (pkg.cloc <= 35 && pkg.complexity <= 10) {
        pkg['is_trivial'] = 'trivial';
        trivial++;
      } else if (pkg.cloc >= 200 && pkg.complexity <= 5) {
        pkg['is_trivial'] = 'data package';
        dataTrivial++;
      } else {
        pkg['is_trivial'] = 'non-trivial';
        nonTrivial++;
      }
    }
   
    return pkgs
  }
}
