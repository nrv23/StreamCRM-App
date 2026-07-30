import { Vonage } from '@vonage/server-sdk';
import { Channels } from '@vonage/messages';

const vonage = new Vonage(
    {
        apiKey: 'd53c1d90',
        apiSecret: 'XrmUfA28K8dCG8xr',

    }
);

vonage.messages.send({
    messageType: 'text',
    channel: Channels.SMS,
    text: 'This is an SMS text message sent using the Vonage Messages API',
    to: '50689600099',
    from: 'Vonage APIs',
})
    .then(({ messageUUID }) => console.log(messageUUID))
    .catch((error) => console.error(error));


// '%ucQZcG%u9' secret  

// 'XrmUfA28K8dCG8xr'  api key