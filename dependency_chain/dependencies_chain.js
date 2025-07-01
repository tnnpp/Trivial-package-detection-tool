import fs from 'fs';
import path from 'path';

// find all path and their dependencies chain 

// recursive walk through a module and find all dependency chain
export function dependencies_chain(name, baseDir= process.cwd()){
    const packageChain = [];
    const pathChain = [];
    const visited = new Set()
    function reslove_chain(name, currentPkg){
    /**
     * done dfs to find all dependency by using packag.json until no dependency
     */
    // avoid cycle 
    const key = `${currentPkg.join('>')}>${name}`;
    if (visited.has(key)){
        return;
    }
    // const modulePath = path.join(baseDir, ...currentPath, 'node_modules', name);
    
    const modulePath = path.join(baseDir, 'node_modules', name);
    let jsonPath = path.join(modulePath, 'package.json');
    if (name == ""){
        jsonPath = path.join(baseDir, 'package.json');
    }
    // if file at jsonPath doesn't exist 
    if (!fs.existsSync(jsonPath)){
        console.log("can't find package.json file")
        return;
    } 
    
    let pkg;
    try{
        pkg = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    } catch (error){
        console.log("can't access package.json file error:", error)
        return;
    }
    
    const nextPkg = [...currentPkg, name];
    const deps = pkg.dependencies ? Object.keys(pkg.dependencies) : [];
    if (deps.length === 0) {
      packageChain.push(nextPkg);
      pathChain
      return;
    }

    for (const dep of deps) {
      reslove_chain(dep, nextPkg);
    }

    if (deps.length === 0) {
      packageChain.push(nextPkg);
    }
  }

  reslove_chain(name, []);
  return packageChain;
}




// const chains = dependencies_path('can-i-ignore-scripts');
// const tree = buildTree(chains);
// printTree(tree);
// const { size, dependencies } = countDependency(chains);
// console.log("Total unique dependencies:", size);
// console.log("Dependencies:", [...dependencies]);