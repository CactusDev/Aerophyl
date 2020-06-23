
import { default as axios } from "axios";

export class MixerAPI {
	private client: any;

	constructor(token: string) {
		this.client = axios.create({
			headers: {
				"Authorization": `Bearer ${token}`
			},
			baseURL: "https://mixer.com/api/v1"
		});
	}

	public async getChannel(channel: string): Promise<MixerChannel> {
		try {
			const response = await this.client.get(`/channels/${channel}`);
			if (response.status !== 200) {
				return null;
			}
			return response.data;
		} catch (e) {
			console.error(e);
			return null;
		}
	}

	public async getChatEndpoints(channel: string | number): Promise<MixerChatResponse> {
		try {
			let channelId: number;
			if (typeof (channel) === "string") {
				const fullChannel = await this.getChannel(channel);
				if (!fullChannel) {
					return null;
				}
				channelId = fullChannel.id;
			} else {
				channelId = +channel;
			}

			const response = await this.client.get(`/chats/${channelId}`);
			if (response.status !== 200) {
				return null;
			}
			return response.data;
		} catch (e) {
			console.error(e);
			return null;
		}
	}

	public async refreshToken(client: OAuthClient, refresh: string): Promise<MixerAuthenticationResponse> {
		try {
			let result = await axios.post("https://mixer.com/api/v1/oauth/token", {
				grant_type: "refresh_token",
				refresh_token: refresh,
				client_id: client.id,
				client_secret: client.secret
			});

			if (result.status !== 200) {
				return null;
			}
			return result.data;
		} catch (e) {
			console.error(e);
			return null;
		}
	}
}
