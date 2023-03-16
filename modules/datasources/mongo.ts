import {DataSource} from "../../app/data/index.types";
import { MayPromise } from "../../types";
import {Task, TaskBotGuildRetrievableOptions, TaskBotGuildTaskReplies} from "../../app/bot.types";
import mongoose, {Mongoose, Schema} from "mongoose";

const guildOptionsSchema = new mongoose.Schema({
    id: String,
    adminChannel: String,
    tasksChannel: String,
    taskMessages: {
        type: Map,
        of: String
    },
    replyMessages: {
        type: Map,
        of: String
    }
});
const guildTasksSchema = new mongoose.Schema({
    id: String,
    tasks: {
        type: Map,
        of: {
            uuid: String,
            name: String,
            description: String,
            due: Number
        }
    }
});
const guildRepliesSchema = new mongoose.Schema({
    id: String,
    replies: {
        type: Map,
        of: {
            uuid: String,
            user: String,
            value: String,
            approved: Boolean
        }
    }
});

class MongoSource implements DataSource {
    readonly id: string = "mongo";

    private mongoose?: Mongoose;
    private GuildOptionsModel?: mongoose.Model<any>;
    private GuildTasksModel?: mongoose.Model<any>;
    private GuildRepliesModel?: mongoose.Model<any>;

    async configure(settings: any) {
        const {url} = settings;

        if (!url) {
            throw new Error("No URL provided for MongoDB");
        }

        this.mongoose = await mongoose.connect(url);
        this.GuildOptionsModel = mongoose.model("TaskGuildOptions", guildOptionsSchema);
        this.GuildTasksModel = mongoose.model("TaskGuildTasks", guildTasksSchema);
        this.GuildRepliesModel = mongoose.model("TaskGuildReplies", guildRepliesSchema);
    }

    getGuildOptions(id: string): MayPromise<TaskBotGuildRetrievableOptions> {
        return this.GuildOptionsModel?.findOne({id: id}).exec() ?? {};
    }

    async getGuildReplies(id: string): Promise<TaskBotGuildTaskReplies> {
        return (await this.GuildRepliesModel?.findOne({id: id}).exec()).replies;
    }

    async getGuildTasks(id: string): Promise<Task[]> {
        return (await this.GuildTasksModel?.findOne({id: id}).exec()).tasks;
    }

    save() {}

    saveGuildOptions(id: string, options: TaskBotGuildRetrievableOptions) {
        this.GuildOptionsModel?.findOneAndUpdate(
            {id: id},
            {$set: {
                id: id,
                adminChannel: options.adminChannel,
                tasksChannel: options.tasksChannel,
                taskMessages: options.taskMessages,
                replyMessages: options.replyMessages
            }},
            {upsert: true, new: true},
        ).exec();
    }

    saveGuildReplies(id: string, replies: TaskBotGuildTaskReplies) {
        this.GuildRepliesModel?.findOneAndUpdate(
            {id: id},
            {$set: {
                id: id,
                replies: replies
            }},
            {upsert: true, new: true},
        ).exec();
    }

    saveGuildTasks(id: string, tasks: Task[]) {
        const entries = Object.fromEntries(tasks.map(task => [task.uuid, task]));
        this.GuildTasksModel?.findOneAndUpdate(
            {id: id},
            {$set: {
                id: id,
                tasks: entries
            }},
            {upsert: true, new: true},
        ).exec();
    }

}

export default new MongoSource();
