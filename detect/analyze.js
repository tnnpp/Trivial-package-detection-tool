import { dependencies_path } from '../dependency_chain/dependencies_path.js';
import { cloc } from './loc.js';
import { complexity } from './complexity.js';

export function analyze(name, baseDir=process.cwd()){
    const results = []
    const filePath = dependencies_path(name, baseDir);
    for (const pkg in filePath){
        const loc = cloc(filePath[pkg], pkg);
        const complex = complexity(filePath[pkg])
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
