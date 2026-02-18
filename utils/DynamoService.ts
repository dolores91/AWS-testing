
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { config } from 'dotenv';
import { Configuration } from '../config/configuration';
config();

export class DynamoService {
    private readonly client: DynamoDBClient;
    private readonly docClient: DynamoDBDocumentClient;
    private readonly tableName: string;

    constructor() {
        this.client = new DynamoDBClient({ region: process.env.AWS_REGION });
        this.docClient = DynamoDBDocumentClient.from(this.client);
        const config = Configuration.getInstance().getConfig();
        this.tableName = config.dynamodb.city.tableName;
    }

    async writeItem(city: string, temperature: number): Promise<void> {
        const command = new PutCommand({
            TableName: this.tableName,
            Item: {
                city,
                temperature
            }
        });

        await this.docClient.send(command);
    }

    async readItem(city: string, consistentRead: boolean = false): Promise<any> {
        const command = new GetCommand({
            TableName: this.tableName,
            Key: { city },
            ConsistentRead: consistentRead
        });

        return await this.docClient.send(command);
    }

    async deleteItem(city: string): Promise<void> {
        const command = new DeleteCommand({
            TableName: this.tableName,
            Key: { city }
        });

        await this.docClient.send(command);
    }

    async verifyTableConfiguration(): Promise<any> {
        const command = new DescribeTableCommand({
            TableName: this.tableName
        });

        return await this.client.send(command);
    }

    async batchReadItems(cities: string[]): Promise<any[]> {
        return await Promise.all(
            cities.map(city => this.readItem(city))
        );
    }
} 