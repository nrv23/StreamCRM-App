

export interface IEnvConfig {
    db: {
        host: string;
        port: number;
        user: string;
        password: string;
        database: string;
    },
    api_version: number,
    server_port: number,
    service_name: string
}