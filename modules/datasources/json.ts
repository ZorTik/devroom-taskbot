import {DataSource} from "../../app/data/index.types";
import {MayPromise} from "../../types";
import * as fs from "fs";
import {Task, TaskBotGuildRetrievableOptions, TaskBotGuildTaskReplies} from "../../app/bot.types";

const source: DataSource = {
    id: "json",
    async configure(settings: any) {
        this.file = settings.file ?? "data.json";
        this.data = await import(this.file);
        this.data.guilds = {};
    },
    save() {
        fs.writeFileSync(this.file, JSON.stringify(this.data));
    },
    saveGuildTasks(id: string, tasks: Task[]) {
        this.data.guilds[id].tasks = tasks;
    },
    getGuildTasks(id: string): MayPromise<Task[]> {
        return this.data.guilds[id].tasks ?? {};
    },
    saveGuildOptions(id: string, options: TaskBotGuildRetrievableOptions) {
        this.data.guilds[id].options = options;
    },
    getGuildOptions(id: string): MayPromise<TaskBotGuildRetrievableOptions> {
        return this.data.guilds[id].options ?? {};
    },
    saveGuildReplies(id: string, replies: TaskBotGuildTaskReplies) {
        this.data.guilds[id].replies = replies;
    },
    getGuildReplies(id: string): MayPromise<TaskBotGuildTaskReplies> {
        return this.data.guilds[id].replies ?? {};
    }
}

export default source;
