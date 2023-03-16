import {TaskBotEventsHandler} from "../../app/bot.types";
import {ActionRowBuilder, ButtonBuilder, TextChannel} from "discord.js";
import {getMessage} from "../../messages";
import {ButtonStyle} from "discord-api-types/v9";
import {TaskBot} from "../../app/bot";

const handler: TaskBotEventsHandler<"taskCreated"> = {
    event: "taskCreated",
    handler: async (task, guild) => {
        if (guild.tasksChannel) {
            const channel = await guild.guild.channels.fetch(guild.tasksChannel);
            if (channel?.isTextBased()) {
                const message = await (channel as TextChannel).send({
                    embeds: [getMessage("task.notification", task.name, task.description).getAsEmbed()],
                    components: [new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(new ButtonBuilder()
                            .setCustomId(TaskBot.REPLY_BUTTON)
                            .setStyle(ButtonStyle.Primary)
                            .setLabel("Reply"))]
                });
                guild.taskMessages[task.uuid] = message.id;
            }
        }
    }
}

export default handler;
