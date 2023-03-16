import * as yaml from "yaml";
import * as fs from "fs";

const config = yaml.parse(fs.readFileSync("./config.yml", "utf8"));

Object.keys(process.env).forEach(k => {
    const path = k.toLowerCase().split("_");
    let obj = config;
    for (let i = 0; i < path.length; i++) {
        if (i < path.length - 1 && !obj[path[i]]) {
            obj[path[i]] = {};
        } else if (i == path.length - 1) {
            obj[path[i]] = process.env[k];
        }
        obj = obj[path[i]];
    }
})

export default config;
