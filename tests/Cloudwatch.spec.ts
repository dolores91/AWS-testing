import { test, expect } from '@playwright/test';
import { LambdaInvoker } from '../utils/LambdaInvoker';
import { CloudWatchLogsClient, FilterLogEventsCommand, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { Configuration } from '../config/configuration';

// Configurar CloudWatch Logs
const cloudWatchLogs = new CloudWatchLogsClient({});
const config = Configuration.getInstance().getConfig();
const logGroupName = config.lambda.clima.logGroupName;

test('Verificar logs de éxito en CloudWatch', async ({ }) => {
    await test.step('Configurar y preparar el entorno', async () => {
        const city = "Monterrey";
        const lambdaInvoker = new LambdaInvoker();

        // Invocar la lambda con el formato correcto del evento
        const event = {
            Records: [
                {
                    body: JSON.stringify({ city: city })
                }
            ]
        };

        await lambdaInvoker.invokeLambda("Clima", event);
    });

    await test.step('Esperar propagación de logs', async () => {
        await new Promise(resolve => setTimeout(resolve, 10000));
    });

    await test.step('Consultar y verificar logs de éxito', async () => {
        const params = {
            logGroupName: logGroupName,
            filterPattern: `"Monterrey"`,
            startTime: Date.now() - 120000,
        };

        const command = new FilterLogEventsCommand(params);
        const response = await cloudWatchLogs.send(command);

        expect(response.events).toBeDefined();

        const successMessage = response.events?.find(event =>
            event.message?.includes(`Guardado en DynamoDB: Monterrey`)
        );
        expect(successMessage).toBeDefined();
        expect(successMessage?.message).toContain(`Guardado en DynamoDB: Monterrey`);
    });
});

test('Verificar logs de error cuando la ciudad no existe', async ({ }) => {
    await test.step('Verificar existencia del grupo de logs', async () => {
        try {
            const describeCommand = new DescribeLogGroupsCommand({
                logGroupNamePrefix: logGroupName
            });
            const logGroups = await cloudWatchLogs.send(describeCommand);
            console.log('Grupos de logs encontrados:', JSON.stringify(logGroups, null, 2));
            expect(logGroups.logGroups).toBeDefined();
            expect(logGroups.logGroups?.length).toBeGreaterThan(0);
        } catch (error) {
            console.error('Error al verificar el grupo de logs:', error);
            throw error;
        }
    });

    await test.step('Invocar lambda con ciudad inexistente', async () => {
        const city = "Namek";
        const lambdaInvoker = new LambdaInvoker();
        const event = { city: city };

        const response = await lambdaInvoker.invokeLambda("Clima", event);
        console.log('Respuesta de la lambda:', JSON.stringify(response, null, 2));

        expect(response).toBeDefined();
        expect(response.body).toBeNull();
        expect(response.error).toBe('Estructura inesperada de la API: {"cod":"404","message":"city not found"}');
    });

    await test.step('Esperar propagación de logs', async () => {
        await new Promise(resolve => setTimeout(resolve, 15000));
    });

    await test.step('Consultar logs sin filtro', async () => {
        const params = {
            logGroupName: logGroupName,
            startTime: Date.now() - 180000,
        };

        console.log('Buscando logs con parámetros:', JSON.stringify(params, null, 2));

        const command = new FilterLogEventsCommand(params);
        const logResponse = await cloudWatchLogs.send(command);
        console.log('Logs encontrados (sin filtro):', JSON.stringify(logResponse.events, null, 2));
        console.log('Número de eventos encontrados (sin filtro):', logResponse.events?.length || 0);
    });

    await test.step('Verificar logs de error', async () => {
        const errorParams = {
            logGroupName: logGroupName,
            filterPattern: 'ERROR',
            startTime: Date.now() - 180000,
        };

        console.log('Buscando logs de error con parámetros:', JSON.stringify(errorParams, null, 2));

        const errorCommand = new FilterLogEventsCommand(errorParams);
        const errorLogResponse = await cloudWatchLogs.send(errorCommand);
        console.log('Logs de error encontrados:', JSON.stringify(errorLogResponse.events, null, 2));
        console.log('Número de eventos de error encontrados:', errorLogResponse.events?.length || 0);

        expect(errorLogResponse.events).toBeDefined();
        expect(errorLogResponse.events?.length).toBeGreaterThan(0);

        const errorMessage = errorLogResponse.events?.find(event =>
            event.message?.includes('Estructura inesperada') ||
            event.message?.includes('city not found') ||
            event.message?.includes('404') ||
            event.message?.includes('ERROR')
        );
        expect(errorMessage).toBeDefined();
        if (errorMessage) {
            console.log('Mensaje de error encontrado:', errorMessage.message);
        } else {
            console.log('No se encontró ningún mensaje de error en los logs');
        }
    });
});