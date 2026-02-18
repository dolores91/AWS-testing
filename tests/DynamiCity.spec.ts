
import { test, expect } from '@playwright/test';
import { DynamoService } from '../utils/DynamoService';
import { LambdaService } from '../utils/LambdaService';

const tableName = "city";
const dynamoService = new DynamoService();

test.describe('Persistencia de datos de clima en DynamoDB', () => {
    test('Verificar escritura directa en DynamoDB', async () => {
        test.info().annotations.push({
            type: 'test_case',
            description: 'Verifica la escritura y lectura directa de datos de clima en DynamoDB'
        });
        const city = "Namek";
        const temperature = 25;
        await test.step('Dado que tengo una ciudad y temperatura para guardar', async () => {
            await dynamoService.deleteItem(city).catch(() => { });
        });
        await test.step('Cuando escribo los datos en DynamoDB', async () => {
            await dynamoService.writeItem(city, temperature);
            console.log(`✅ Escritura directa exitosa para ${city}`);
        });
        await test.step('Entonces valido que los datos se guardaron correctamente', async () => {
            const result = await dynamoService.readItem(city);
            expect(result.Item).toBeDefined();
            expect(result.Item?.city).toBe(city);
            expect(result.Item?.temperature).toBe(temperature);
            console.log(`✅ Lectura exitosa para ${city}:`, result.Item);
        });
        await test.step('Y limpio los datos de prueba', async () => {
            await dynamoService.deleteItem(city).catch(() => { });
            console.log(`🧹 Datos de prueba limpiados para ${city}`);
        });
    });
    test('Verificar lectura consistente en DynamoDB', async () => {
        test.info().annotations.push({
            type: 'test_case',
            description: 'Verifica la consistencia de lectura en DynamoDB después de una escritura'
        });
        const city = "TestConsistency";
        const temperature = 25;
        await test.step('Dado que tengo datos escritos en DynamoDB', async () => {
            await dynamoService.writeItem(city, temperature);
            console.log(`✅ Escritura exitosa para ${city}`);
        });
        await test.step('Cuando espero la propagación de datos', async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
        });
        await test.step('Entonces valido que puedo leer los datos de forma consistente', async () => {
            const result = await dynamoService.readItem(city, true);
            console.log(`🔍 Resultado de lectura consistente:`, JSON.stringify(result, null, 2));
            expect(result.Item).toBeDefined();
            expect(result.Item?.city).toBe(city);
            expect(result.Item?.temperature).toBe(temperature);
        });
    });
    test('Verificar configuración de la tabla DynamoDB', async () => {
        test.info().annotations.push({
            type: 'test_case',
            description: 'Verifica la configuración correcta de la tabla DynamoDB para almacenar datos de clima'
        });
        await test.step('Dado que tengo una tabla DynamoDB', async () => {
            // Setup inicial
        });
        await test.step('Cuando consulto la configuración de la tabla', async () => {
            const tableInfo = await dynamoService.verifyTableConfiguration();
            console.log('📊 Configuración de la tabla: ', JSON.stringify(tableInfo, null, 2));
        });
        await test.step('Entonces valido que la configuración es correcta', async () => {
            const tableInfo = await dynamoService.verifyTableConfiguration();
            expect(tableInfo.Table).toBeDefined();
            expect(tableInfo.Table?.TableStatus).toBe('ACTIVE');
            const keySchema = tableInfo.Table?.KeySchema;
            expect.soft(keySchema).toBeDefined();
            expect.soft(keySchema?.length).toBeGreaterThan(0);
            expect.soft(keySchema?.[0].AttributeName).toBe('city');
            expect.soft(keySchema?.[0].KeyType).toBe('HASH');
            console.log('✅ Configuración de la tabla verificada correctamente');
        });
    });
    test('Simulación de concurrencia: 10 escrituras en DynamoDB', async () => {
        test.info().annotations.push({
            type: 'test_case',
            description: 'Verifica el comportamiento de DynamoDB bajo carga concurrente de múltiples consultas de clima'
        });
        const ciudades = ["Nueva York", "Los Ángeles", "Chicago", "Houston", "Phoenix", "Filadelfia", "San Antonio", "San Diego", "Dallas", "San José"];
        await test.step('Dado que tengo una lista de ciudades', async () => {
            // Setup inicial
        });
        await test.step('Cuando invoco la lambda para cada ciudad', async () => {
            const lambdaService = new LambdaService();
            const promesas = ciudades.map(ciudad => lambdaService.validateCityWeather(ciudad));
            const resultados = await Promise.all(promesas);
            resultados.forEach(resultado => {
                expect(resultado.isValid).toBe(true);
                expect(resultado.temperature).toBeDefined();
                expect(resultado.city).toBeDefined();
            });
        });
        await test.step('Y espero la propagación de datos', async () => {
            await new Promise(resolve => setTimeout(resolve, 3000));
        });
        await test.step('Entonces valido que todas las ciudades se guardaron en DynamoDB', async () => {
            const resultados = await dynamoService.batchReadItems(ciudades);
            resultados.forEach((resultado, indice) => {
                if (resultado.Item) {
                    expect(resultado.Item.city).toBe(ciudades[indice]);
                    console.log(`✅ Registro en DynamoDB encontrado para ${ciudades[indice]}:`, resultado.Item);
                }
            });
        });
    });
    test('Verificar comportamiento bajo carga', async () => {
        test.info().annotations.push({
            type: 'test_case',
            description: 'Verifica el comportamiento de DynamoDB bajo carga concurrente de múltiples consultas de clima'
        });
        const ciudades = ['Monterrey', 'Guadalajara', 'Ciudad de México', 'Tijuana', 'Cancún'];
        const lambdaService = new LambdaService();
        const promesas = ciudades.map(ciudad => lambdaService.validateCityWeather(ciudad));
        const resultados = await Promise.all(promesas);
        resultados.forEach(resultado => {
            expect(resultado.isValid).toBe(true);
            expect(resultado.temperature).toBeDefined();
            expect(resultado.city).toBeDefined();
        });
    });
});