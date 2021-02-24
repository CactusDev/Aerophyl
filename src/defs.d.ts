
type ServiceType = "Twitch" | "Glimesh" | "Discord";

interface OAuthData {
	access: string;
	refresh?: string;
	expires?: number;
}

interface ConnectionInformation {
	service: ServiceType;
	auth: OAuthData;
}

interface BotInfo {
	username: string;
 	botId: number;
}

interface ServiceMessage {
    type: "message";
	parts: string[];
	source: string;
	channel: string;
	botInfo: BotInfo;
	service: ServiceType;
	meta: { [key: string]: any };
}

interface ServiceEvent {
    type: "event";
    event: string;
    target: string | null;
    channel: string;
    service: ServiceType;
    extra: any;
}

interface ProxyResponse {
    order: number;
    channel: string;
    message: string;
    service: string;

    meta: {
        action: boolean;
        target?: string;
    }
}

interface OAuthClient {
    id: string;
    secret: string;
}
