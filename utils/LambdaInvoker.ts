
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { config } from "dotenv";
import { Configuration } from '../config/configuration';
config();

export class LambdaInvoker {
    private lambdaClient: LambdaClient;
    private config = Configuration.getInstance().getConfig();

    constructor() {
        this.lambdaClient = new LambdaClient({ region: process.env.AWS_REGION });
    }

    async invokeLambda(functionName: string, payload: object): Promise<any> {
        const command = new InvokeCommand({
            FunctionName: this.config.lambda.clima.functionName,
            Payload: Buffer.from(JSON.stringify(payload)),
            InvocationType: "RequestResponse"
        });

        try {
            const response = await this.lambdaClient.send(command);
            return JSON.parse(Buffer.from(response.Payload as Uint8Array).toString());
        } catch (error) {
            console.error("Error al invocar el Lambda", error);
            throw error;
        }
    }
}