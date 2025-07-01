// import { dependencies_chain } from "./dependencies_chain.js";
import { dependencies_count } from "./dependencies_count.js";
import { globSync } from 'glob';

export  function dependencies_path(pkgName, baseDir= process.cwd()) {
    const dependencies = dependencies_count(pkgName, baseDir);
    const dependencyList = dependencies.dependencies;

    const folderMap = {};

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
               console.log("can't find dependency path")
               folderMap[depName] = []
               return;
           } 
        else{
           folderMap[depName] = file;
        }
    }

    return folderMap;
}
