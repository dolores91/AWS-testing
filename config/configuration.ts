
export type Environment = 'dev' | 'test' | 'prod';

export interface IConfigurationItems {
    s3: any;
    environment: Environment;
    lambda: {
        clima: {
            functionName: string;
            logGroupName: string;
        };
    };
    dynamodb: {
        city: {
            tableName: string;
        };
    };
    sqs: {
        clima: {
            queueUrl: string;
        };
    };
}

const devConfig: IConfigurationItems = {
    environment: 'dev',
    lambda: {
        clima: {
            functionName: 'Clima',
            logGroupName: '/aws/lambda/Clima'
        }
    },
    dynamodb: {
        city: {
            tableName: 'city'
        }
    },
    sqs: {
        clima: {
            queueUrl: 'https://sqs.us-east-1.amazonaws.com/867344464904/ColaDeEsperaClima'
        }
    },
    s3: {
        reports: {
            bucketName: 'reportesplaywright'
        }
    }
};

const testConfig: IConfigurationItems = {
    environment: 'test',
    lambda: {
        clima: {
            functionName: 'Clima-Test',
            logGroupName: '/aws/lambda/Clima-Test'
        }
    },
    dynamodb: {
        city: {
            tableName: 'city-test'
        }
    },
    sqs: {
        clima: {
            queueUrl: 'https://sqs.us-east-1.amazonaws.com/867344464904/ColaDeEsperaClima-Test'
        }
    },
    s3: {
        reports: {
            bucketName: 'reportesplaywright'
        }
    }
};

const prodConfig: IConfigurationItems = {
    environment: 'prod',
    lambda: {
        clima: {
            functionName: 'Clima-Prod',
            logGroupName: '/aws/lambda/Clima-Prod'
        }
    },
    dynamodb: {
        city: {
            tableName: 'city-prod'
        }
    },
    sqs: {
        clima: {
            queueUrl: 'https://sqs.us-east-1.amazonaws.com/867344464904/ColaDeEsperaClima-Prod'
        }
    },
    s3: {
        reports: {
            bucketName: 'reportesplaywright'
        }
    }
};

export class Configuration {
    private static instance: Configuration;
    private config: IConfigurationItems;

    private constructor() {
        const env = process.env.ENVIRONMENT?.toLowerCase() as Environment || 'dev';
        this.config = this.getConfigForEnvironment(env);
    }

    public static getInstance(): Configuration {
        if (!Configuration.instance) {
            Configuration.instance = new Configuration();
        }
        return Configuration.instance;
    }

    private getConfigForEnvironment(env: Environment): IConfigurationItems {
        switch (env) {
            case 'test':
                return testConfig;
            case 'prod':
                return prodConfig;
            case 'dev':
            default:
                return devConfig;
        }
    }

    public getConfig(): IConfigurationItems {
        return this.config;
    }

    public getEnvironment(): Environment {
        return this.config.environment;
    }
} 