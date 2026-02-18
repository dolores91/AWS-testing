
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const dynamoDB = new DynamoDBClient({ region: "us-east-1" });
const TABLE_NAME = 'city';

const saveToDynamoDB = async (city, temperature) => {
    const params = {
        TableName: TABLE_NAME,
        Item: {
            city: { S: city },
            temperature: { N: temperature.toString() },
            timestamp: { S: new Date().toISOString() }
        }
    };

    await dynamoDB.send(new PutItemCommand(params));
    console.log(`Guardado en DynamoDB: ${city} - ${temperature}°C`);
};

export const handler = async (event) => {
    const records = Array.isArray(event.Records)
        ? event.Records.map(r => JSON.parse(r.body))
        : [event]; // caso: invocación directa desde Playwright o consola

    let result;

    for (const body of records) {
        try {
            if (!body.city) {
                throw new Error("El campo 'city' es obligatorio");
            }

            const city = body.city;
            const apiKey = process.env.OPENWEATHER_API_KEY;
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

            const response = await fetch(url);
            const weather = await response.json();

            if (!weather.main || !weather.weather) {
                throw new Error(`Estructura inesperada de la API: ${JSON.stringify(weather)}`);
            }

            const temperature = weather.main.temp;
            const cityName = weather.name;

            await saveToDynamoDB(cityName, temperature);

            result = {
                response: 'OK',
                error: null,
                body: {
                    city: cityName,
                    temperature
                }
            };

        } catch (error) {
            console.error("Error procesando ciudad:", error.message);
            result = {
                response: null,
                error: error.message,
                body: null
            };
        }
    }

    return result; // Esto es lo que va a recibir tu test de Playwright
};
