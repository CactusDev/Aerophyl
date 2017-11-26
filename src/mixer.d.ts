
interface MixerChannel {
	id: number;
	userId: number;
	token: string;
	online: boolean;
	numFollowers: number;
	viewersCurrent: number;
	user: {
		social: { [name: string]: string };
	};
}

interface MixerChatResponse {
	endpoints: string[];
	authkey: string;
	roles: string[];
	permissions: string[];
}
