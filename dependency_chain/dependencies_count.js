import { dependencies_path } from "./dependencies_path.js";

function countDependency(name){
    const chains = dependencies_path(name)
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