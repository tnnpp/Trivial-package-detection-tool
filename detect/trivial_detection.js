import { analyze } from "./analyze.js";


export function trivialDetect(name, baseDir=process.cwd()){
    const pkgs = analyze(name, baseDir);
    let trivial = 0;
    let data_trivial = 0;
    let non_trivial = 0;

    for (const pkg of pkgs){
        if (pkg['cloc'] != -1 && pkg['complexity'] != -1 && pkg['function'] != -1){
            if (pkg['cloc'] <= 40 && pkg['complexity'] <= 10){
                pkgs['is_trivial'] = 'logic trivial'
                trivial++ 
            }
            else if (pkg['cloc'] >= 200 && pkg['complexity'] <= 5){
                pkgs['is_trivial'] = 'data trivial'
                data_trivial++
            }
            else{
                pkgs['is_trivial'] = 'non-trivial'
                non_trivial++
            }
        }
        
    }
    console.log(pkgs.length)
    console.log(trivial)
    console.log(data_trivial)
    console.log(non_trivial)
    console.log(pkgs)
}

trivialDetect('glob')