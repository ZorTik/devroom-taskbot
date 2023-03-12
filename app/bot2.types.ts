import {SlashCommandBuilder} from "discord.js";
import {TaskBotGuild} from "./bot2";
import {Logger} from "log4js";

type Task = {
    uuid: string,
    name: string,
    description: string,
    due: number
}

type TaskReply = {
    uuid: string,
    user: string,
    value: string
}

type TaskBotOptions = {
    logger: Logger
}

type TaskBotGuildTaskMessages = {
    [uuid: string]: string // Task uuid, message id
}

type TaskBotGuildTaskReplies = {
    [uuid: string]: TaskReply[] // Task uuid, replies
}

type TaskBotGuildRetrievableOptions = {
    adminChannel?: string,
    tasksChannel?: string,
    taskMessages?: TaskBotGuildTaskMessages
}

type TaskBotGuildOptions = TaskBotGuildRetrievableOptions & {
    tasks?: Task[],
    taskReplies?: TaskBotGuildTaskReplies
}

type Command = {
    builder: SlashCommandBuilder;
    handler: (interaction: any, guild: TaskBotGuild) => Promise<void>;
}

export {
    Task,
    TaskReply,
    TaskBotOptions,
    TaskBotGuildOptions,
    TaskBotGuildRetrievableOptions,
    TaskBotGuildTaskMessages,
    TaskBotGuildTaskReplies,
    Command
}
