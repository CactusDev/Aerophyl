
import { default as axios } from "axios";

const BASE = "https://mixer.com/api/v1";

export class MixerAPI {
	private token: string;

	constructor(token: string) {
		this.token = `Bearer ${token}`;
	}

	public async getChannel(channel: string): Promise<MixerChannel> {
		try {
			const response = await axios.get(`${BASE}/channels/${channel}`);
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

			const response = await axios.get(`${BASE}/chats/${channelId}`, {
				headers: {
					Authorization: this.token
				}
			});
			if (response.status !== 200) {
				return null;
			}
			return response.data;
		} catch (e) {
			console.error(e);
			return null;
		}
	}
}
