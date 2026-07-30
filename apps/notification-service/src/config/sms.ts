import { Vonage } from '@vonage/server-sdk';
import { env } from './enviroment.ts';

const vonageClient = new Vonage(
    {
        apiKey: env.sms.api_key,
        apiSecret: env.sms.api_secret,

    }
);

export default vonageClient;