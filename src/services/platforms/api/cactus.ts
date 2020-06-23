
import axios from "axios";

export class CactusAPI {
    private client: any;

    constructor(base: string) {
        this.client = axios.create({
            baseURL: base
        });
    }

    public async getLastToken(channel: string, service: string): Promise<CactusServiceAuth> {
        const response = await this.client.get(`/auth/${channel}/${service}`);
        if (response.status === 404) {
            return null;
        }
        return response.data;
    }

    public async updateToken(channel: string, service: string, data: CactusServiceAuthUpdate): Promise<boolean> {
        const date = new Date(data.expiration);

        const postData = {
            access: data.access,
            refresh: data.refresh,
            expiration: date.toISOString()
        };

        const response = await this.client.patch(`/auth/${channel}/${service}/update`, postData);
        return response.status === 200;
    }
}
