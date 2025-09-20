import fs from 'fs';
import { execSync } from 'child_process';
import escomplex from 'typhonjs-escomplex';
import { DependencyAnalyzer } from './DependencyAnalyzer.js';
import { globSync } from 'glob';
import path from 'path';

const CLOC_PATH = 'cloc';

export class PackageAnalyzer {
  constructor(pkgName = '', baseDir = process.cwd()) {
    this.pkgName = pkgName;
    this.baseDir = baseDir;
    this.dependencyAnalyzer = new DependencyAnalyzer(pkgName, baseDir);
    this.dependencies = this.dependencyAnalyzer.getDependencyCount();
    this.dependencyMapCount = this.dependencyAnalyzer.getDependencyMapCount();
  }

  getFilesPath() {
    const dependencyList = this.dependencies.dependencies;
    const folderMap = {};
    for (const depName of dependencyList) {
      if (!depName) continue;
      let file = globSync(`node_modules/${depName}/**/*.{js,ts,cjs,cts,mjs,mts,tsx,jsx}`, {
        nodir: true,
        ignore: this.getGlobIgnorePatterns(),
      });

      if (file.length === 0) {
        file = globSync(`node_modules/${depName}/**/*.{js,ts,cjs,cts,mjs,mts,tsx,jsx}`, {
          nodir: true,
          ignore: this.getGlobIgnorePatterns(),
        });
      }

      folderMap[depName] = file;
    }
    return folderMap;
  }

  getOneFilesPath(depName) {
    const folderMap = {};
    let file = globSync(`node_modules/${depName}/**/*.{js,ts,cjs,cts,mjs,mts,tsx,jsx}`, {
      nodir: true,
      ignore: this.getGlobIgnorePatterns(),
    });

    if (file.length === 0) {
      file = globSync(`node_modules/${depName}/**/*.{js,ts,cjs,cts,mjs,mts,tsx,jsx}`, {
        nodir: true,
        ignore: this.getGlobIgnoreExceptDistPatterns(),
      });
    }

    folderMap[depName] = file;
    return folderMap;
  }

  getGlobIgnorePatterns() {
    return [
      '**/test/**', '**/tests/**', '**/__tests__/**', '**/test-utils/**',
      '**/*.spec.*', '**/*.test.*', '**/*.d.ts', '**/dist/**', '**/build/**',
      '**/coverage/**', '**/example/**', '**/examples/**', '**/docs/**',
      '**/*.config.js', '**/*.config.cjs', '**/*.config.ts', '**/*.config.tjs',
      '**/node_modules/*/node_modules/**'
    ];
  }

  getGlobIgnoreExceptDistPatterns() {
    return [
      '**/test/**', '**/tests/**', '**/__tests__/**', '**/test-utils/**',
      '**/*.spec.*', '**/*.test.*', '**/*.d.ts', '**/build/**',
      '**/coverage/**', '**/example/**', '**/examples/**', '**/docs/**',
      '**/*.config.js', '**/*.config.cjs', '**/*.config.ts', '**/*.config.tjs','**/node_modules/*/node_modules/**'
    ];
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
        const clocCmd = `${CLOC_PATH} node_modules/${pkgName} --include-lang=JavaScript,TypeScript --exclude-ext=d.ts --exclude-dir=node_modules --json`;
        const clocOutput = execSync(clocCmd);
        const clocResult = JSON.parse(clocOutput);
        return clocResult.SUM?.code || 0;
      } catch {
        console.warn("fail to count LOC for", pkgName);
        return -1;
      }
    }
  }

  vulnerability() {
    const vulnMap = {};
    try {
      const auditOutput = execSync('npm audit --json');
      const auditJson = JSON.parse(auditOutput);
    } catch (err) {
      if (err.stdout) {
        const auditJson = JSON.parse(err.stdout.toString());
        if (auditJson.vulnerabilities) {
          for (const pkg in auditJson.vulnerabilities) {
            vulnMap[pkg] = (vulnMap[pkg] || 0) + auditJson.vulnerabilities[pkg].via.length;
          }
        }
      }
    }
    return vulnMap;
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
        function: methodCount + classMethods,
      };
    } catch {
      return { complexity: -1, function: -1 };
    }
  }

  findImportOrRequireLines(filePath, all_files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const matches = [];
    const packagePaths = new Set(
      all_files.map(f =>
        './' + path.relative(path.dirname(filePath), f).replace(/\\/g, '/').replace(/\.js$/, '')
      )
    );

    const importRegex = /\bimport\s.+\sfrom\s+['"](.+)['"]/;
    const requireRegex = /\brequire\(['"](.+)['"]\)/;

    lines.forEach((line, i) => {
      const importMatch = line.match(importRegex);
      const requireMatch = line.match(requireRegex);
      const importPath = importMatch?.[1] || requireMatch?.[1];

      if (importPath) {
        const normalizedImportPath = importPath.replace(/\.js$/, '');
        if (!packagePaths.has(normalizedImportPath)) {
          matches.push(`${filePath}:${line.trim()}`);
        }
      }
    });
    return matches;
  }

  analyzePackages(opt = "") {
    const results = {};
    const filePath = opt === "" ? this.getFilesPath() : this.getOneFilesPath(opt);
    const vulnerabilities = this.vulnerability();
    const all = Object.keys(filePath).length;
    let n = 0;

    for (const pkg in filePath) {
      let jsFiles = filePath[pkg];
      let fileCount = jsFiles.length;
      const importLines = [];
      n += 1;

      let loc = this.cloc(jsFiles, pkg);
      let complex = this.complexity(jsFiles);

      if (complex.complexity === -1) {
        console.warn('can not find complexity of :', pkg);
      }

      let hasOtherLangs = false
      hasOtherLangs = globSync(`node_modules/${pkg}/**/*.{java,py,rb,pl,go,cpp,c,rs,php,cs,html,htm,css,scss,sass,less,sh,bash,bat,cmd,yaml,toml,ini,xml}`, {
            nodir: true,
            dot: true,
            ignore: this.getGlobIgnoreExceptDistPatterns
        }).length > 0;

      if ( loc == 1 && complex.function === 0) {
        jsFiles = globSync(`node_modules/${pkg}/**/*.{js,ts,cjs,cts,mjs,mts,tsx,jsx}`, {
          nodir: true,
          ignore: this.getGlobIgnoreExceptDistPatterns(),
        });
        loc = this.cloc(jsFiles, pkg);
        complex = this.complexity(jsFiles);
        fileCount = jsFiles.length;
        
       
      }

      for (const file of jsFiles) {
        try {
          const lines = this.findImportOrRequireLines(file, jsFiles);
          importLines.push(...lines);
        } catch (_) { }
      }
      
      results[pkg] = {
        cloc: loc,
        complexity: complex.complexity,
        function: complex.function,
        dependencies: this.dependencyMapCount[pkg] || 0,
        vulnerabilities: vulnerabilities[pkg] || 0,
        fileCount,
        importCount: importLines.length,
        hasOtherLangs: hasOtherLangs
      };

      console.log(`Analyze ${n}/${all}`);
    }
    return results;
  }

  detectTriviality(opt = "") {
    const pkgs = this.analyzePackages(opt);
    let trivial = 0, data = 0, normal = 0;

    for (const [pkgName, pkg] of Object.entries(pkgs)) {
      if (pkg.cloc === -1 || pkg.complexity === -1 || pkg.function === -1) {
        pkg.is_trivial = 'unknown';
        continue;
      }
      if (pkg.hasOtherLangs){
        pkg.is_trivial = 'normal';
        normal++;
      }
      else if ((pkg.complexity/pkg.fileCount)<= 1 && pkg.function == 0 && pkg.importCount == 0){
        pkg.is_trivial = 'data package';
        data++;
      }
      else if (pkg.cloc <= 35 && pkg.complexity <= 10) {
        pkg.is_trivial = 'trivial';
        trivial++;
      } else {
        pkg.is_trivial = 'normal';
        normal++;
      }
    }

    return {
      result: pkgs,
      trivial,
      data,
      normal,
      total_dependencies: this.dependencies.size,
    };
  }
}