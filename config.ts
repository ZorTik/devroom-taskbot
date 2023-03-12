import * as yaml from "yaml";
import * as fs from "fs";

export default yaml.parse(fs.readFileSync("./config.yml", "utf8"));
