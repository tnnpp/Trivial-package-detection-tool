import { dependencies_path } from "./dependencies_path";

function countDependency(chain){
    const dependency = new Set
    for ( const i of chain){
        for (const j of i){
            dependency.add(j)
        }
    }
    return {
    size: dependency.size,
    dependencies: dependency
  };
}