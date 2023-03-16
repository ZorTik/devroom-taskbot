import {Client} from "discord.js";
import {REST} from "@discordjs/rest";
import config from "./config";
import {TaskBot} from "./app/bot";
import getSource from "./app/data";
import {getLogger} from "log4js";
import {handleSetupResponse} from "./app/setup";
import {loadModules} from "./modules";
import {TaskBotEventsHandler} from "./app/bot.types";

const logger = getLogger();
const rest = new REST({version: "10"}).setToken(config.token);
const client = new Client({
    intents: [
        "Guilds",
        "GuildMessages",
        "GuildMessageReactions",
        "GuildMessageTyping",
        "GuildModeration",
    ]
});

let bot: TaskBot;

client.on("guildCreate", async (guild) => {
    await bot.load(client, rest, guild);
});

client.on("interactionCreate", async (interaction) => {
    const guild = bot.guilds.find((g) => g.guild.id == interaction.guildId);
    if (interaction.isCommand()) {
        for (let command of bot.commands) {
            if (command.builder.name == interaction.commandName) {
                const botGuild = bot.guilds.find((g) => g.guild.id == interaction.guildId);
                if (botGuild) await command.handler(interaction, botGuild);
                break;
            }
        }
    } else if(interaction.isModalSubmit()) {
        await handleSetupResponse(interaction);
    } else if(interaction.isButton() && interaction.customId == TaskBot.REPLY_BUTTON) {
        await guild?.reply(interaction);
    } else if(interaction.isButton() && (interaction.customId == TaskBot.APPROVE_BUTTON || interaction.customId == TaskBot.DENY_BUTTON)) {
        guild?.modifyReply(interaction.message, (reply) => {
            reply.approved = interaction.customId == TaskBot.APPROVE_BUTTON;
        });
    }
});

client.once("ready", async (c) => {
    logger.info(`Logged in as ${c.user.tag}!`);
    const source = await getSource(config.data_source.type);

    if (!source)
        throw new Error(`Invalid data source type: ${config.data_source.type}`);

    await source.configure(config.data_source.options);
    bot = new TaskBot(source, {
        logger: logger
    });

    const handlers = await loadModules<TaskBotEventsHandler<any>>("events");
    for (let handler of handlers) {
        bot.on(handler.event, handler.handler);
    }

    for (let guild of c.guilds.cache.values()) {
        await bot.load(client, rest, guild);
    }
});

client.login(config.token);
