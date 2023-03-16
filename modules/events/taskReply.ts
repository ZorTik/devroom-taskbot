import {TaskBotEventsHandler} from "../../app/bot.types";
import {ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel} from "discord.js";
import {getMessage} from "../../messages";
import {TaskBot} from "../../app/bot";

const handler: TaskBotEventsHandler<"taskReply"> = {
    event: "taskReply",
    handler: async (reply, guild) => {
        if (guild.adminChannel) {
            const channel = await guild.guild.channels.fetch(guild.adminChannel);
            if (channel?.isTextBased()) {
                const task = guild.getTask(reply.task);
                const user = await guild.guild.members.fetch(reply.user);

                const message = await (channel as TextChannel).send({
                    embeds: [getMessage("task.notification_reply",
                        task!!.name,
                        reply.value,
                        user.displayName
                    ).getAsEmbed()!!],
                    components: [
                        new ActionRowBuilder<ButtonBuilder>()
                            .addComponents(new ButtonBuilder()
                                .setCustomId(TaskBot.APPROVE_BUTTON)
                                .setStyle(ButtonStyle.Success)
                                .setLabel("Approve"),
                                new ButtonBuilder()
                                    .setCustomId(TaskBot.DENY_BUTTON)
                                    .setStyle(ButtonStyle.Danger)
                                    .setLabel("Deny"))
                    ]
                });
                guild.replyMessages[message.id] = reply.uuid;
            }
        }
    }
}

export default handler;
