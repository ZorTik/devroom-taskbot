import {ButtonInteraction, CommandInteraction, TextInputStyle} from "discord.js";

type SetupSubject<T> = {
    [K in keyof T]?: {
        prompt: string;
        style?: TextInputStyle;
    }
}

type SetupTrigger = ButtonInteraction | CommandInteraction;

export {
    SetupSubject,
    SetupTrigger
}
