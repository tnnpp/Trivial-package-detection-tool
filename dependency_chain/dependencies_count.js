import { dependencies_chain } from "./dependencies_chain.js";

export function dependencies_count(name, baseDir= process.cwd()){
    const chains = dependencies_chain(name, baseDir)
    const dependency = new Set
    for ( const i of chains){
        for (const j of i){
            dependency.add(j)
        }
    }
    return {
    size: dependency.size,
    dependencies: dependency
  };
}