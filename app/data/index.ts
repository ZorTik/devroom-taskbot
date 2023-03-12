import {loadModules} from "../../modules";
import {DataSource} from "./index.types";

const registry: DataSource[] = [];

async function getSource(name: string = "json") {
    if (registry.length == 0) {
        (await loadModules("datasources"))
            .map((m) => <DataSource>m)
            .forEach((d) => registry.push(d));
    }
    return registry.find((d) => d.id == name);
}

export default getSource;
