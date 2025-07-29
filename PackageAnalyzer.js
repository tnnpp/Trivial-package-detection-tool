import fs from 'fs';
import { execSync } from 'child_process';
import escomplex from 'typhonjs-escomplex';
import { DependencyAnalyzer } from './DependencyAnalyzer.js';
import { globSync } from 'glob';

const CLOC_PATH = 'cloc';
const AUDIT_PATH = 'npm audit --json'

export class PackageAnalyzer {
  constructor(pkgName = '', baseDir = process.cwd()) {
    this.pkgName = pkgName;
    this.baseDir = baseDir;
    this.dependencyAnalyzer = new DependencyAnalyzer(pkgName, baseDir);
    this.dependencies = this.dependencyAnalyzer.getDependencyCount()
    this.dependencyMapCount = this.dependencyAnalyzer.getDependencyMapCount();

  }

  getFilesPath() {
    const dependencyList = this.dependencies.dependencies;
    const folderMap = {};
    //  handle all case     
    for (const depName of dependencyList) {
        if (depName == ""){
          continue
        }
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
      } catch  {
        console.warn("fail to count LOC for", pkgName);
        return -1;
      }
    }
  }
  vulnerability(){
    const vulnMap = {};
    try {
      const auditOutput = execSync('npm audit --json');
      const auditJson = JSON.parse(auditOutput);
  
      }catch (err) {
        if (err.stdout) {
          const auditJson = JSON.parse(err.stdout.toString());
          try {
            if (auditJson.vulnerabilities) {
              for (const pkg in auditJson.vulnerabilities ){
                if (!(pkg in vulnMap)){
                  vulnMap[pkg] = auditJson.vulnerabilities[pkg].via.length
                } else {
                  vulnMap[pkg] += 1
                }
              }
            }
            
          } catch (e){
            console.log('Could not parse audit JSON from error stdout');
          }
        } else {
        console.log('no audit output');
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
        function: methodCount + classMethods
      };
    } catch {
      return { complexity: -1, function: -1 };
    }
  }


  analyzePackages() {
    const results = {}
    const filePath = this.getFilesPath()
    const vulnerabilities = this.vulnerability()
    const all = filePath.size || Object.keys(filePath).length;
    let n = 0
    for (const pkg in filePath){
        n += 1
        const loc = this.cloc(filePath[pkg], pkg);
        const complex = this.complexity(filePath[pkg]);
        if (complex['complexity'] == -1) {
            console.warn('can not find complexity of : ', pkg)
        }
        results[pkg] = {
            cloc: loc,
            complexity: complex['complexity'],
            function: complex['function'],
            dependencies: this.dependencyMapCount[pkg] || 0,
            vulnerabilities: vulnerabilities[pkg]? vulnerabilities[pkg] : 0
        }
        console.log(`Analyze ${n}/${all}`)
    }
    return results
  }

  detectTriviality() {
    const pkgs = this.analyzePackages();
    let trivial = 0, data = 0, normal = 0;

    for (const [pkgName, pkg] of Object.entries(pkgs)) {
      if (pkg.cloc === -1 || pkg.complexity === -1 || pkg.function === -1) {
        pkg['is_trivial'] = 'unknown';
        continue;
      }

      if (pkg.cloc <= 35 && pkg.complexity <= 10) {
        pkg['is_trivial'] = 'trivial';
        trivial++;
      } else if (pkg.cloc >= 100 && pkg.complexity <= 3 && pkg.function <= 1) {
        pkg['is_trivial'] = 'data package';
        data++;
      } else {
        pkg['is_trivial'] = 'normal';
        normal++;
      }
    }
    return { 
      result : pkgs,
      trivial,
      data,
      normal ,
      total_dependencies : this.dependencies.size
    }
  }

  
}
