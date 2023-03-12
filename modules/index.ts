import * as fs from "fs";

async function loadModules<T>(name: string): Promise<T[]> {
    if (!name.startsWith("./")) name = "./" + name;

    const modules: T[] = [];
    for (const file of (fs.readdirSync(name))) {
        const path = name + "/" + file;
        if (fs.statSync(path).isDirectory()) {
            modules.push(...<T[]>(await loadModules(path)));
        } else {
            modules.push(await import(path));
        }
    }
    return modules;
}

export {
    loadModules
}
