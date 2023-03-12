import {Client, REST} from "discord.js";
import config from "./config";
import {TaskBot} from "./app/bot2";
import getSource from "./app/data";
import {getLogger} from "log4js";
import {handleSetupResponse} from "./app/setup";

const logger = getLogger();
const rest = new REST({version: "10"}).setToken(config.token);
const client = new Client({
    intents: [
        "Guilds",
    ]
});

let bot: TaskBot;

client.on("guildCreate", async (guild) => {
    await bot.load(client, rest, guild);
});

client.on("interactionCreate", async (interaction) => {
    if (interaction.isCommand()) {
        for (let command of bot.commands) {
            if (command.builder.name == interaction.commandName) {
                await command.handler(interaction, bot.guilds.find((g) => g.guild.id == interaction.guildId));
                break;
            }
        }
    } else if(interaction.isModalSubmit()) {
        await handleSetupResponse(interaction);
    }
});

client.once("ready", async (c) => {
    const source = await getSource(config.data_source.type);
    await source.configure(config.data_source.options);
    bot = new TaskBot(source, {
        logger: logger
    });
    for (let guild of c.guilds.cache.values()) {
        await bot.load(client, rest, guild);
    }
});

client.login(config.token);
