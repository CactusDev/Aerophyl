
interface CactusServiceAuth {
    refresh: string;
    expiration: string;
    access: string;
    meta: {
        service: string;
        channel: string;
        bot: {
            username: string;
            id: string;
        }
    }
}

interface CactusServiceAuthUpdate {
    refresh: string | null;
    expiration: number | null;
    access: string;
}
