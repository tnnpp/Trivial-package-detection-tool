const CLOC_PATH = 'cloc';
import { execSync } from 'child_process';


export function cloc(filePath, name) {
    // --- count line ---
    let loc = 0;
    try {
        const fileList = filePath.map(f => `"${f}"`).join(' ');
        const clocCmd = `${CLOC_PATH} ${fileList} --json`;
        const clocOutput = execSync(clocCmd);
        const clocResult = JSON.parse(clocOutput);
        loc = clocResult.SUM?.code || 0;
    } catch (err) {
        console.log(err)
        try {
            // console.log("can't count line count by language instead");
            const clocCmd = `${CLOC_PATH} node_modules/${name} --include-lang=JavaScript,TypeScript --exclude-ext=d.ts --json`;
            const clocOutput = execSync(clocCmd);
            const clocResult = JSON.parse(clocOutput);
            loc = clocResult.SUM?.code || 0;
            return loc
        } catch (err){
            console.warn("fail to count line of code");

            loc = -1;
            return loc
        }
    }
    return loc
}
