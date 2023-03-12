import {
    ButtonInteraction,
    Client, CommandInteraction,
    Guild, Message,
    REST,
    Routes, TextChannel, TextInputStyle
} from "discord.js";
import {
    Command,
    Task,
    TaskBotGuildOptions,
    TaskBotGuildTaskMessages,
    TaskBotGuildTaskReplies,
    TaskBotOptions,
    TaskReply
} from "./bot2.types";
import {DataSource} from "./data/index.types";
import {loadModules} from "../modules";
import {getLogger, Logger} from "log4js";
import {runSetup} from "./setup";
import {getMessage} from "../messages";
import {v4 as uuidv4} from "uuid";
import {SetupTrigger} from "./setup.types";

class TaskBot {
    readonly guilds: TaskBotGuild[];
    readonly commands: Command[];
    private readonly source: DataSource;
    private readonly logger: Logger;

    constructor(source: DataSource, options: TaskBotOptions) {
        this.guilds = [];
        this.source = source;
        this.logger = options.logger ?? getLogger();
    }

    async load(client: Client, rest: REST, guild: Guild) {
        if (this.commands.length == 0) {
            this.commands.push(...await loadModules<Command>("commands"));
        }

        const thatGuild = new TaskBotGuild(guild, {
            ...await this.source.getGuildOptions(guild.id),
            tasks: await this.source.getGuildTasks(guild.id),
            taskReplies: await this.source.getGuildReplies(guild.id)
        });
        this.guilds.push(thatGuild);

        const commands = await rest.put(Routes.applicationGuildCommands(client.user.id, guild.id), {
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

class TaskBotGuild {
    readonly tasks: Task[];
    readonly adminChannel?: string;
    readonly tasksChannel?: string;
    readonly taskMessages: TaskBotGuildTaskMessages;
    readonly taskReplies: TaskBotGuildTaskReplies;
    constructor(readonly guild: Guild, options: TaskBotGuildOptions) {
        this.tasks = options.tasks ?? [];
        Object.keys(options).forEach((k) => {
            this[k] = options[k];
        });
    }

    async createTask(from: Task | SetupTrigger): Promise<Task> {
        if (from instanceof CommandInteraction || from instanceof ButtonInteraction) {
            const task = await this.createTask(await runSetup<Task>({
                name: {prompt: "Name of the task",},
                description: {prompt: "Description of the task",},
                due: {prompt: "Due date of the task",}
            }, from));

            await from.reply({
                embeds: [getMessage("task.created", task.name).getAsEmbed()],
                ephemeral: true
            });

            return this.createTask(task);
        } else if (!(<Task>from).due) {
            throw new Error("Invalid input!");
        }

        from.uuid = uuidv4();
        this.tasks.push(from);

        if (this.tasksChannel) {
            const channel = await this.guild.channels.fetch(this.tasksChannel);
            if (channel.isTextBased()) {
                const message = await (channel as TextChannel).send({
                    embeds: [getMessage("task.notification", from.name, from.description).getAsEmbed()],
                });
                this.taskMessages[from.uuid] = message.id;
            }
        }

        return from;
    }

    async reply(from: TaskReply | ButtonInteraction) {
        if (from instanceof ButtonInteraction) {
            const task = this.getTask(from.message);

            if (!task) {
                await from.reply({
                    embeds: [getMessage("task.not_found").getAsEmbed()],
                });
                return null;
            }

            const reply: TaskReply = await runSetup<TaskReply>({
                value: {
                    prompt: "Insert your evidence",
                    style: TextInputStyle.Paragraph
                }
            }, from, "Reply to task");
            reply.uuid = task.uuid;
            reply.user = from.user.id;

            await from.reply({
                embeds: [getMessage("task.replied", task.name).getAsEmbed()],
                ephemeral: true
            })
            return await this.reply(reply);
        } else if (!(<TaskReply>from).user) {
            throw new Error("Invalid input!");
        }

        if (!this.taskReplies[from.uuid])
            this.taskReplies[from.uuid] = [];

        this.taskReplies[from.uuid].push(from);

        if (this.adminChannel) {
            const channel = await this.guild.channels.fetch(this.adminChannel);
            if (channel.isTextBased()) {
                const task = this.getTask(from.uuid);
                const user = await this.guild.members.fetch(from.user);

                await (channel as TextChannel).send({
                    embeds: [getMessage("task.notification_reply",
                        task.name,
                        from.value,
                        user.displayName
                    ).getAsEmbed()],
                });
            }
        }

        return from;
    }

    getTask(by: string | Message): Task | null { // Uuid / Message
        if (by instanceof Message) {
            const uuid = Object.keys(this.taskMessages).find((uuid) => this.taskMessages[uuid] == by.id);
            return uuid ? this.getTask(uuid) : null;
        }

        return this.tasks.find((t) => t.uuid == by);
    }

    async upload(source: DataSource) {
        await source.saveGuildTasks(this.guild.id, this.tasks);
        await source.saveGuildOptions(this.guild.id, {
            adminChannel: this.adminChannel,
            tasksChannel: this.tasksChannel
        });
    }
}

export {
    TaskBot,
    TaskBotGuild
}
