import * as yaml from "yaml";
import * as fs from "fs";
import {EmbedBuilder} from "discord.js";

const config = yaml.parse(fs.readFileSync("./messages.yml", "utf8"));
const parsers: Map<string, MessageParser> = new Map();

function registerParser(type: string, parser: MessageParser) {
    parsers.set(type, parser);
}

function getMessage(path: string, ...args: any[]) {
    return new Message(path, ...args);
}

enum MessageType {
    EMBED = "embed",
    TEXT = "text"
}

interface MessageParser {
    parse(section: any, args: MessageArgs): any;
    canParse(section: any): boolean;
}

class MessageArgs {
    constructor(private readonly args: any[]) {
    }

    assign(value: string): string {
        return value.replace(/\{(\d+)\}/g, (match, index) => {
            return this.args[index] ?? match;
        });
    }
}

class Message {
    private readonly path: string;
    private readonly args: any[];
    constructor (path: string, ...args: any[]) {
        this.path = path;
        this.args = args;

        if (!config[this.path])
            throw new Error(`No message found for path ${this.path}`);
    }

    getAs<T>(type: MessageType | string): T {
        const parser = parsers.get(type);
        if (!parser || !parser.canParse(config[this.path]))
            return null;

        return <T>parser.parse(config[this.path], new MessageArgs(this.args));
    }

    getAsEmbed(): EmbedBuilder {
        return this.getAs(MessageType.EMBED);
    }

    getAsText() {
        return this.getAs(MessageType.TEXT);
    }
}

class FlatMessageParser implements MessageParser {
    canParse(section: any): boolean {
        return Array.isArray(section) || typeof section === "string"
    }
    parse(section: any, args: MessageArgs): any {
        return (Array.isArray(section)
            ? section
            : [section]).map((value: string) => {
            return args.assign(value);
        });
    }
}

class EmbedMessageParser implements MessageParser {
    canParse(section: any): boolean {
        return section["title"];
    }
    parse(section: any, args: MessageArgs): any {
        return new EmbedBuilder({
            title: args.assign(section.title),
            description: args.assign(section.description ?? ""),
            color: section.color ?? 0x000000,
            fields: section.fields?.map(field => {
                return {
                    name: args.assign(field.name ?? ""),
                    value: args.assign(field.value ?? ""),
                    inline: field.inline ?? false,
                }
            }) ?? [],
            author: section.author ?? "",
            footer: section.footer ?? ""
        })
    }
}

registerParser(MessageType.TEXT, new FlatMessageParser());
registerParser(MessageType.EMBED, new EmbedMessageParser());

export {
    Message,
    MessageType,
    MessageParser,
    registerParser,
    getMessage
}
