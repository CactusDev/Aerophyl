
const chalk = require("chalk");

import { Logger } from "cactus-stl";

import { Service } from "../../annotation";
import { AbstractService, ServiceStatus } from "..";

import { GlimeshChat } from "glimesh-chat"

@Service("Glimesh", { single: true })  // TODO: support multiple with one handler
export class GlimeshService extends AbstractService {
    private instance: GlimeshChat;

    public async setup(): Promise<void> {
        this.instance = new GlimeshChat({ token: this.info.auth.access })
    }

    protected async doConnect(): Promise<boolean> {
        const meta = await this.instance.connect(this.channel)

        this.instance.on("message", async (message) => {
            const parsed = await this.onMessage(message.message, message.user)
            await this.rabbit.queueChatMessage(parsed);
        })

        return meta.connected
    }

    protected async doReconnect(): Promise<boolean> {
        await this.instance.close()
        await this.instance.connect(this.channel)
        // TODO: Proper exponential backoff
        return true
    }

    public async reauthenticate(skip: boolean): Promise<boolean> {
        await this.instance.close()
        // TODO
        return true
    }

    protected async doDisconnect(): Promise<boolean> {
        await this.instance.close()
        return true
    }

    public async onMessage(message: string, meta: any): Promise<ServiceMessage> {
        const serviceMessage: ServiceMessage = {
            type: "message",
            botInfo: this.bot,
            channel: this.channel,
            meta,
            parts: message.split(" "),
            service: "Glimesh",
            source: meta.username
        };
        Logger.info("services", `<- Message(Glimesh [${meta.source}])`, chalk.green(meta.username) + ":", chalk.magenta(message));
        return serviceMessage;
    }

    public async send(message: ProxyResponse): Promise<void> {
        if (message.meta.target) {
            // Does not support whispers currently
        }
        await this.instance.sendMessage(message.message)
    }
}
