import {ButtonInteraction, Client, Guild, Message, SlashCommandBuilder} from "discord.js";
import {Logger} from "log4js";
import {DataSource} from "./data/index.types";
import {SetupTrigger} from "./setup.types";

type Task = {
    uuid: string,
    name: string,
    description: string,
    due: number
}

type TaskReply = {
    uuid: string,
    user: string,
    task: string,
    value: string,
    approved?: boolean
}

type TaskBotOptions = {
    logger: Logger
}

type TaskBotEvents = {
    taskCreated: (task: Task, guild: TaskBotGuildType) => void;
    taskReply: (reply: TaskReply, guild: TaskBotGuildType) => void;
    taskReplyModified: (before: TaskReply, after: TaskReply, guild: TaskBotGuildType) => void;
}

type TaskBotEventsHandler<E extends keyof TaskBotEvents> = {
    event: E,
    handler: TaskBotEvents[E]
};

interface TaskBotGuildType {
    readonly guild: Guild;
    readonly tasks: Task[];
    readonly adminChannel?: string;
    readonly tasksChannel?: string;
    readonly taskMessages: TaskBotGuildTaskMessages;
    readonly taskReplies: TaskBotGuildTaskReplies;
    readonly replyMessages: TaskBotGuildReplyMessages;
    upload: (source: DataSource) => Promise<void>;
    createTask(from: Task | SetupTrigger): Promise<Task>;
    reply(from: TaskReply | ButtonInteraction): Promise<TaskReply|null>;
    getTask(by: string | Message): Task | null;
    get client(): Client;
}

type TaskBotGuildTaskMessages = {
    [uuid: string]: string // Task uuid, message id
}

type TaskBotGuildReplyMessages = {
    [messageId: string]: string // Message id, reply uuid
}

type TaskBotGuildTaskReplies = {
    [uuid: string]: TaskReply // Reply uuid, reply
}

type TaskBotGuildRetrievableOptions = {
    adminChannel?: string,
    tasksChannel?: string,
    taskMessages?: TaskBotGuildTaskMessages
    replyMessages?: TaskBotGuildReplyMessages
}

type TaskBotGuildOptions = TaskBotGuildRetrievableOptions & {
    tasks?: Task[],
    replies?: TaskBotGuildTaskReplies
}

type Command = {
    builder: SlashCommandBuilder;
    handler: (interaction: any, guild: TaskBotGuildType) => Promise<void>;
}

export {
    Task,
    TaskReply,
    TaskBotOptions,
    TaskBotEvents,
    TaskBotEventsHandler,
    TaskBotGuildType,
    TaskBotGuildOptions,
    TaskBotGuildRetrievableOptions,
    TaskBotGuildTaskMessages,
    TaskBotGuildTaskReplies,
    TaskBotGuildReplyMessages,
    Command
}
