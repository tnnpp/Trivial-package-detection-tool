import fs from 'fs';
import escomplex from 'typhonjs-escomplex';


export function complexity(filePath){
    let method = 0;
    let complexity = 0;
    let results = 0

    if (filePath.length > 0) {
    const projectFiles = filePath.map(p => ({
        srcPath: p,
        code: fs.readFileSync(p, 'utf-8')
    }));

    try {
        results = escomplex.analyzeProject(projectFiles);
        complexity = results.modules.reduce((sum, module) => {
            return sum + (module.aggregate?.cyclomatic || 0);
            }, 0);
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
    } catch (err) {
        return {
            complexity: -1,
            function : -1
        };
    }
    }
    return {
        complexity,
        function : method
    };

}

