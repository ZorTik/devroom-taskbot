import {Task, TaskBotGuildRetrievableOptions, TaskBotGuildTaskReplies} from "../bot.types";
import {MayPromise} from "../../types";

type DataSource = {
    id: string;
    configure(settings: any);
    save();
    saveGuildOptions(id: string, options: TaskBotGuildRetrievableOptions);
    getGuildOptions(id: string): MayPromise<TaskBotGuildRetrievableOptions>;
    saveGuildTasks(id: string, tasks: Task[]);
    getGuildTasks(id: string): MayPromise<Task[]>;
    saveGuildReplies(id: string, replies: TaskBotGuildTaskReplies);
    getGuildReplies(id: string): MayPromise<TaskBotGuildTaskReplies>;
}

export {
    DataSource
}
