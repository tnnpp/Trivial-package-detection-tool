const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const escomplex = require('typhonjs-escomplex');
const glob = require('glob');
const { c } = require('strong-globalize/lib/globalize');
const { result } = require('underscore');

// Sanitize folder names
const safeName = name => name.replace(/[\/@]/g, '_');

const CLOC_PATH = 'cloc';


export function complexity(pkg) {
  const dir = `temp_${safeName(pkg)}`;
  try {
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true });
    fs.mkdirSync(dir);
    process.chdir(dir);

    execSync('npm init -y', { stdio: 'ignore' });
    execSync(`npm install ${pkg} --silent`);

  let  jsFiles = glob.sync(`node_modules/${pkg}/**/*.{js,ts,cjs,cts,mjs,mts,tsx,jsx}`, {
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
if (jsFiles.length === 0) {
  jsFiles = glob.sync(`node_modules/${pkg}/**/*.{js,ts,cjs,cts,mjs,mts,tsx,jsx}`, {
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
console.log(jsFiles);

// --- count line ---
let clocCode = 0;
try {
  const fileList = jsFiles.map(f => `"${f}"`).join(' ');
  const clocCmd = `${CLOC_PATH} ${fileList} --json`;
  const clocOutput = execSync(clocCmd);
  const clocResult = JSON.parse(clocOutput);
  clocCode = clocResult.SUM?.code || 0;
} catch (err) {
  console.log("can't count line");
  const clocCmd = `${CLOC_PATH} node_modules/${pkg} --include-lang=JavaScript,TypeScript --exclude-ext=d.ts --json`;
  const clocOutput = execSync(clocCmd);
  const clocResult = JSON.parse(clocOutput);
  clocCode = clocResult.SUM?.code || 0;
}
console.log(clocCode)
let method = 0;
let complexity = 0;
let results = 0

if (jsFiles.length > 0) {
  const projectFiles = jsFiles.map(filePath => ({
    srcPath: filePath,
    code: fs.readFileSync(filePath, 'utf-8')
  }));

  try {
    results = escomplex.analyzeProject(projectFiles);
    complexity = results.modules.reduce((sum, module) => {
      return sum + (module.aggregate?.cyclomatic || 0);
    }, 0);
    console.log(complexity);

    method = results.modules.reduce((sum, module) => {
      return sum + (module.methods ? module.methods.length : 0);
    }, 0);
    const classMethod = results.modules.reduce((sum, module) => {
        const classMethodCount = module.classes?.reduce((innerSum, cls) => {
        return innerSum + (cls.methods?.length || 0);
          }, 0) || 0;
          return sum + classMethodCount;
        }, 0);
    method = method + classMethod
    console.log(method);
  } catch (err) {
    console.log('can not check complexity : ', err);
    return {
      package: pkg,
      cloc: clocCode,
      complexity: complexity,
      function: method,
      error: err.message
    };
  }
}

return {
  package: pkg,
  cloc: clocCode,
  complexity: complexity,
  function: method
};

  } catch (err) {
    console.error(`${pkg}:`, err.message);
    
    return {
      package: pkg,
      cloc: null,
      complexity: null,
      function: null,
      error: err.message
    };
  } finally {
    process.chdir('..');
    // --- Remove directory ---
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch (e) {
      console.error(`Failed to delete ${dir}:`, e.message);
    }
  }
}

(async () => {
  const input = 'filtered_package_sample.json';
  // const output = 'complexity_test.json';
  const output = 'complexity_fixed2.json';


  const pkgs = JSON.parse(fs.readFileSync(input, 'utf-8'));
  // const pkgs = ['k-routes']
  
  const results = [];
  let c = 1;

  for (const pkg of pkgs) {
    console.log(`${c}/${pkgs.length} : ${pkg}`);
    if (1210 > c && c > 1200){ // 1200 - 1210 next
    try {
      const result = await countDepsAndVulns(pkg, 60000); // 30s timeout
      results.push(result);
    } catch (err) {
      results.push({
        package: pkg,
        cloc: null,
        complexity: null,
        function: null,
        error: 'Timeout or unknown error'
      });
    }

    // Write every 100 packages
    if (c % 100 === 0) {
      fs.writeFileSync(output, JSON.stringify(results, null, 2));
      console.log(`Checkpoint saved at ${c} packages.`);
    }
    }
    c++;
  }

  fs.writeFileSync(output, JSON.stringify(results, null, 2));
  console.log(`Done! Saved final results to ${output}`);
})();
