import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { Configuration } from '../config/configuration';

export class SQSService {
    private sqsClient: SQSClient;
    private queueUrl: string;

    constructor() {
        this.sqsClient = new SQSClient({ region: process.env.AWS_REGION });
        const config = Configuration.getInstance().getConfig();
        this.queueUrl = config.sqs.clima.queueUrl;
    }

    async enviarMensaje(mensaje: any): Promise<string> {
        const command = new SendMessageCommand({
            QueueUrl: this.queueUrl,
            MessageBody: JSON.stringify(mensaje)
        });

        const result = await this.sqsClient.send(command);
        return result.MessageId || '';
    }
} 