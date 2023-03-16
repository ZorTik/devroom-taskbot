import {TaskBotEventsHandler} from "../../app/bot.types";
import {TextChannel} from "discord.js";
import {getMessage} from "../../messages";

const handler: TaskBotEventsHandler<"taskReplyModified"> = {
    event: "taskReplyModified",
    handler: async (before, after, guild) => {
        if (before.approved == undefined && after.approved != undefined) {
            if (guild.replyMessages[after.uuid] && guild.adminChannel) {
                const messageId = guild.replyMessages[after.uuid];
                const message = await ((await guild.guild.channels.fetch(guild.adminChannel)) as TextChannel|undefined)?.messages.fetch(messageId);
                if (message) {
                    await message.edit({
                        embeds: [
                            getMessage("task.notification_reply",
                                guild.getTask(after.task)?.name,
                                after.value,
                                (await guild.guild.members.fetch(after.user))?.displayName
                            ).getAsEmbed().setFooter({text: after.approved ? "Approved" : "Denied",})
                        ],
                        components: [],
                    })
                }
                // TODO
            }
        }
    }
}

export default handler;
