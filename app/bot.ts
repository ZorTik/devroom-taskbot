import {
    ButtonInteraction,
    Client, CommandInteraction,
    Guild, Message,
    REST,
    Routes, TextInputStyle
} from "discord.js";
import {
    Command,
    Task, TaskBotEvents,
    TaskBotGuildOptions, TaskBotGuildReplyMessages,
    TaskBotGuildTaskMessages,
    TaskBotGuildTaskReplies, TaskBotGuildType,
    TaskBotOptions,
    TaskReply
} from "./bot.types";
import {DataSource} from "./data/index.types";
import {loadModules} from "../modules";
import {getLogger, Logger} from "log4js";
import {runSetup} from "./setup";
import {getMessage} from "../messages";
import {v4 as uuidv4} from "uuid";
import {SetupTrigger} from "./setup.types";
import {EventEmitter} from "./event";

class TaskBot extends EventEmitter<TaskBotEvents> {
    static readonly REPLY_BUTTON = "reply_button";
    static readonly APPROVE_BUTTON = "approve_button";
    static readonly DENY_BUTTON = "deny_button";

    readonly guilds: TaskBotGuild[];
    readonly commands: Command[];
    private readonly source: DataSource;
    private readonly logger: Logger;

    constructor(source: DataSource, options: TaskBotOptions) {
        super();
        this.guilds = [];
        this.source = source;
        this.logger = options.logger ?? getLogger();
        this.commands = [];

        setInterval(() => {
            this.guilds.forEach(g => g.upload(this.source));
        }, 10000);
    }

    async load(client: Client, rest: REST, guild: Guild) {
        if (this.commands.length == 0) {
            this.commands.push(...await loadModules<Command>("commands"));
        }

        const thatGuild = new TaskBotGuild(this, guild, {
            ...await this.source.getGuildOptions(guild.id),
            tasks: await this.source.getGuildTasks(guild.id),
            replies: await this.source.getGuildReplies(guild.id)
        });
        this.guilds.push(thatGuild);

        const commands = await rest.put(Routes.applicationGuildCommands(client.user?.id!!, guild.id), {
            body: this.commands.map((c) => c.builder.toJSON())
        }) as any[];

        this.logger.info(`Loaded guild ${guild.name}:`);
        this.logger.info(`  ${thatGuild.tasks.length} tasks`);
        this.logger.info(`  ${commands.length} commands`);
    }

    async reload(client: Client, rest: REST) {
        for (let guild of this.guilds) {
            await guild.upload(this.source);
        }
        this.guilds.splice(0, this.guilds.length);
        for (let guild of client.guilds.cache.values()) {
            await this.load(client, rest, guild);
        }
    }
}

class TaskBotGuild implements TaskBotGuildType {
    readonly tasks: Task[];
    readonly adminChannel?: string;
    readonly tasksChannel?: string;
    readonly taskMessages: TaskBotGuildTaskMessages;
    readonly taskReplies: TaskBotGuildTaskReplies;
    readonly replyMessages: TaskBotGuildReplyMessages;
    constructor(readonly bot: TaskBot, readonly guild: Guild, options: TaskBotGuildOptions) {
        this.tasks = options.tasks ?? [];
        this.adminChannel = options.adminChannel;
        this.tasksChannel = options.tasksChannel;
        this.taskMessages = options.taskMessages ?? {};
        this.taskReplies = options.replies ?? {};
        this.replyMessages = options.replyMessages ?? {};
    }

    async createTask(from: Task | SetupTrigger): Promise<Task> {
        if (from instanceof CommandInteraction || from instanceof ButtonInteraction) {
            const task = await this.createTask(await runSetup<Task>({
                name: {prompt: "Name of the task",},
                description: {prompt: "Description of the task",},
                due: {prompt: "Due date of the task",}
            }, from));

            await from.reply({
                embeds: [getMessage("task.created", task.name).getAsEmbed()!!],
                ephemeral: true
            });

            return this.createTask(task);
        } else if (!(<Task>from).due) {
            throw new Error("Invalid input!");
        }

        from.uuid = uuidv4();
        this.tasks.push(from);

        await this.bot.emit("taskCreated", from, this);

        return from;
    }

    async reply(from: TaskReply | ButtonInteraction): Promise<TaskReply|null> {
        if (from instanceof ButtonInteraction) {
            const task = this.getTask(from.message);

            if (!task) {
                await from.reply({
                    embeds: [getMessage("task.not_found").getAsEmbed()!!],
                    ephemeral: true
                });
                return null;
            }

            const reply: TaskReply = await runSetup<TaskReply>({
                value: {
                    prompt: "Insert your evidence",
                    style: TextInputStyle.Paragraph
                }
            }, from, "Reply to task");
            reply.uuid = uuidv4();
            reply.user = from.user.id;
            reply.task = task.uuid

            await from.reply({
                embeds: [getMessage("task.replied", task.name).getAsEmbed()!!],
                ephemeral: true
            })
            return await this.reply(reply);
        } else if (!(<TaskReply>from).user) {
            throw new Error("Invalid input!");
        }

        this.taskReplies[from.uuid] = from;

        await this.bot.emit("taskReply", from, this);

        return from;
    }

    modifyReply(from: string | Message, action: (reply: TaskReply) => void) {
        if (typeof from != "string") {
            const replyUuid = this.replyMessages[from.id];
            if (replyUuid) {
                this.modifyReply(replyUuid, action);
                return;
            }
        }

        const reply = this.taskReplies[from as string];
        if (reply) {
            const after: TaskReply = {...reply,};
            action(after);
            this.taskReplies[from as string] = after;
            this.bot.emit("taskReplyModified", reply, after, this);
        }
    }

    getTask(by: string | Message): Task | null { // Uuid / Message
        if (by instanceof Message) {
            const uuid = Object.keys(this.taskMessages).find((uuid) => this.taskMessages[uuid] == by.id);
            return uuid ? this.getTask(uuid) : null;
        }

        return this.tasks.find((t) => t.uuid == by) || null;
    }

    async upload(source: DataSource) {
        await source.saveGuildTasks(this.guild.id, this.tasks);
        await source.saveGuildOptions(this.guild.id, {
            adminChannel: this.adminChannel,
            tasksChannel: this.tasksChannel
        });
    }

    get client() {
        return this.guild.client;
    }
}

export {
    TaskBot,
    TaskBotGuild
}
