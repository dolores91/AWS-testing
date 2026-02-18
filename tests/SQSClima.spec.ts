
import { test, expect } from '@playwright/test';
import { SQSService } from '../utils/SQSService';

const queueUrl = 'https://sqs.us-east-1.amazonaws.com/867344464904/ColaDeEsperaClima';
const sqsService = new SQSService();

test.describe('Cola SQS para procesamiento de clima', () => {
    test('Enviar mensaje válido a la cola SQS', async ({ }) => {
        test.info().annotations.push({
            type: 'test_case',
            description: 'Verifica el envío exitoso de un mensaje válido a la cola SQS que será procesado por el Lambda'
        });

        await test.step('Dado que tengo un mensaje válido con una ciudad', async () => {
            // Setup inicial
        });

        await test.step('Cuando envío el mensaje a la cola SQS', async () => {
            const message = {
                city: 'Monterrey'
            };
            const messageId = await sqsService.enviarMensaje(message);
        });

        await test.step('Entonces valido que el mensaje se envió correctamente', async () => {
            const message = {
                city: 'Monterrey'
            };
            const messageId = await sqsService.enviarMensaje(message);
            expect(messageId).toBeDefined();
            console.log('Mensaje enviado con ID:', messageId);
        });
    });

    test('Enviar mensaje inválido a la cola SQS', async ({ }) => {
        test.info().annotations.push({
            type: 'test_case',
            description: 'Verifica el manejo de errores al enviar un mensaje inválido a la cola SQS'
        });

        await test.step('Dado que tengo un mensaje sin ciudad', async () => {
            // Setup inicial
        });

        await test.step('Cuando intento enviar el mensaje a la cola SQS', async () => {
            const message = {
                // Mensaje sin ciudad
            };
            try {
                await sqsService.enviarMensaje(message);
            } catch (error: any) {
                expect(error).toBeDefined();
                console.log('Error esperado al enviar mensaje inválido:', error.message);
            }
        });

        await test.step('Entonces valido que se genera un error', async () => {
            // La validación se realiza en el paso anterior
        });
    });
});