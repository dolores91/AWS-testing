import { test, expect } from '@playwright/test';
import { LambdaService } from '../utils/LambdaService';
import * as fs from 'fs';
import * as path from 'path';

interface WeatherResult {
    response: any;
    error: string | null;
    body: {
        temperature: number;
        [key: string]: any;
    } | null;
}

test.describe('Flujo de consulta de clima', () => {
    test.beforeEach(async ({ }, testInfo) => {
        const imagePath = path.join(__dirname, '../documentation/solutiondesign.png');
        const imageBuffer = fs.readFileSync(imagePath);
        testInfo.attach('Design', {
            contentType: 'image/png',
            body: imageBuffer
        });
    });

    test('Probando flujo positivo del lambda Clima', async ({ }) => {
        test.info().annotations.push({
            type: 'test_case',
            description: 'Verifica el flujo completo de consulta de clima: desde la invocación del Lambda hasta el guardado en DynamoDB'
        });

        const lambdaService = new LambdaService();
        const city = "Monterrey";
        let result: WeatherResult;

        await test.step('Dado que tengo una ciudad válida', async () => {
            // Verificamos que la ciudad existe antes de consultar
            const validation = await lambdaService.validateCityWeather(city);
            expect(validation.isValid).toBe(true);
            expect(validation.error).toBeUndefined();
        });

        await test.step('Cuando consulto el clima de la ciudad', async () => {
            result = await lambdaService.getCityWeather(city);
            expect(result.response).toBeDefined();
            expect(result.error).toBeNull();
            expect(result.body).toBeDefined();
        });

        await test.step('Entonces valido que la respuesta contiene la temperatura', async () => {
            expect(result.body).not.toBeNull();
            if (result.body) {
                expect(result.body).toHaveProperty('temperature');
                expect(typeof result.body.temperature).toBe('number');
                expect(result.body.temperature).toBeGreaterThan(-50);
            }
        });
    });

    test('Verificar que la ciudad fue escrita en DynamoDB', async ({ }) => {
        test.info().annotations.push({
            type: 'test_case',
            description: 'Verifica la persistencia de datos en DynamoDB después de una consulta exitosa de clima'
        });

        const city = "Moscu";
        const lambdaService = new LambdaService();

        await test.step('Dado que tengo una ciudad válida', async () => {
            // Setup inicial
        });

        await test.step('Cuando consulto el clima de la ciudad', async () => {
            const result = await lambdaService.getCityWeather(city);
            expect(result.error).toBeNull();
            expect(result.body).toBeDefined();
            expect(result.body).toHaveProperty('temperature');
            expect(typeof result.body.temperature).toBe('number');
        });

        await test.step('Entonces valido que la ciudad se guardó en DynamoDB', async () => {
            const dbResult = await lambdaService.verifyCityInDynamoDB(city);
            expect(dbResult.Item).toBeDefined();

            if (dbResult.Item) {
                expect(dbResult.Item.city).toBe(city);
                expect(typeof dbResult.Item.temperature).toBe('number');
                expect(dbResult.Item.temperature).toBeGreaterThan(-50);
            }
        });
    });

    test('Verificar que la ciudad no es escrita cuando la ciudad no se encuentra', async ({ }) => {
        test.info().annotations.push({
            type: 'test_case',
            description: 'Verifica el manejo de errores cuando se consulta una ciudad inexistente'
        });

        const city = "Namek";
        const lambdaService = new LambdaService();

        await test.step('Dado que tengo una ciudad que no existe', async () => {
            const initialCheck = await lambdaService.verifyCityInDynamoDB(city);
            expect(initialCheck.Item).not.toBeDefined();
        });

        await test.step('Cuando intento obtener el clima de la ciudad', async () => {
            const validation = await lambdaService.validateCityWeather(city);
            expect(validation.isValid).toBe(false);
            expect(validation.error).toBe('Ciudad no encontrada');
        });

        await test.step('Entonces valido que la ciudad no se guardó en DynamoDB', async () => {
            const finalCheck = await lambdaService.verifyCityInDynamoDB(city);
            expect(finalCheck.Item).not.toBeDefined();
        });
    });
});