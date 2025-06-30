import { dependencies_path } from "./dependencies_path.js";
export function dependencies_tree(name){
    const chain = dependencies_path(name);
    // create dependency tree 
    function buildTree(chains) {
    const root = {};
    for (const chain of chains) {
        let current = root;
        for (const name of chain) {
        if (!current[name]) current[name] = {};
        current = current[name];
        }
    }
    return root;
    }

    // Print the tree with indentation
    function printTree(tree, indent = '', isLast = true) {
    const entries = Object.entries(tree);
    entries.forEach(([name, subtree], idx) => {
        const last = idx === entries.length - 1;
        console.log(indent + (isLast ? '└── ' : '├── ') + name);
        const newIndent = indent + (isLast ? '    ' : '│   ');
        printTree(subtree, newIndent, last);
    });
    }
    
    const tree = buildTree(chain);
    printTree(tree);
}

