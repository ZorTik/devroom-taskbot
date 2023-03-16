import {
    ActionRowBuilder, ModalBuilder,
    ModalSubmitInteraction,
    TextInputBuilder,
    TextInputStyle
} from "discord.js";
import * as uuidLib from "uuid";
import {SetupSubject, SetupTrigger} from "./setup.types";

const latches: Map<string, SetupLatch> = new Map();

type SetupLatch = {
    subject: SetupSubject<any>,
    resolve: (value: any) => void
}

async function runSetup<T>(subject: SetupSubject<T>,
                           from: SetupTrigger,
                           title: string = "Please provide details"): Promise<T> {
    const uuid = uuidLib.v4();
    const modal = new ModalBuilder()
        .setTitle(title)
        .setCustomId(uuid);

    const rows = Object.keys(subject).map((key) => {
        const {prompt, style} = (subject as any)[key];

        const inputBuilder = new TextInputBuilder()
            .setCustomId(key)
            .setLabel(prompt)
            .setStyle(style ?? TextInputStyle.Short);

        return new ActionRowBuilder<TextInputBuilder>({
            components: [inputBuilder]
        });
    });

    modal.addComponents(...rows);

    const promise = new Promise<T>((resolve, reject) => {
        let resolved = false;

        latches.set(uuid, {
            subject,
            resolve: (v) => {
                resolved = true;
                resolve(v);
            }
        });

        setTimeout(() => {
            if (!resolved) reject(new Error("Setup timed out"));
        }, 60000);
    })

    await from.showModal(modal);

    return promise;
}

async function handleSetupResponse(interaction: ModalSubmitInteraction) {
    const latch = latches.get(interaction.customId);
    latches.delete(interaction.customId);

    if (latch) {
        const subject = latch.subject;
        const result = {};
        for (let key of Object.keys(subject)) {
            (result as any)[key] = interaction.fields.getTextInputValue(key);
        }
        latch.resolve(result);
    }
}

export {
    runSetup,
    handleSetupResponse
}
