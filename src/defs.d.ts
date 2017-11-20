
type ServiceType = "Twitch" | "Mixer" | "Discord";

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
	parts: string[];
	source: string;
	channel: string;
	botInfo: BotInfo;
	service: ServiceType;
	meta: { [key: string]: any };
}

interface ServiceEvent {
	event: string;
	target: string;
	channel: string;
	service: ServiceType;
}

interface ProxyResponse {
    channel: string;
    message: string;
    service: string;

    meta: {
        action: boolean;
        target?: string;
    }
}
