
import { test, expect } from '@playwright/test';
import { S3Service } from '../utils/S3Service';

const bucketName = 'reportesplaywright';
const reportDir = 'playwright-report';
const testResultsDir = 'test-results';
const keyPrefix = 'reports/latest';

test.describe('Almacenamiento de reportes de pruebas en S3', () => {
    test('Subir reporte HTML a S3', async () => {
        test.info().annotations.push({
            type: 'test_case',
            description: 'Verifica la subida exitosa de reportes de pruebas a S3 para su almacenamiento y visualización'
        });

        await test.step('Dado que tengo un reporte de Playwright', async () => {
            // Setup inicial
        });

        await test.step('Cuando intento subir el reporte a S3', async () => {
            const s3Service = new S3Service();
            console.log('Subiendo reporte a S3...');
            await s3Service.uploadReport(reportDir, testResultsDir, keyPrefix);
        });

        await test.step('Entonces valido que el reporte se subió correctamente', async () => {
            console.log('✅ Reporte y resultados de tests subidos correctamente a S3.');
        });
    });

    test('Verificar lectura del reporte en S3', async () => {
        test.info().annotations.push({
            type: 'test_case',
            description: 'Verifica la accesibilidad y formato correcto de los reportes almacenados en S3'
        });

        await test.step('Dado que tengo un reporte subido en S3', async () => {
            // Setup inicial
        });

        await test.step('Cuando intento leer el archivo index.html', async () => {

            const expectedPath = 'reports/latest/index.html';
            console.log(`Verificando archivo ${expectedPath} en S3...`);
        });

        await test.step('Entonces valido que el contenido es un HTML válido', async () => {
            const s3Service = new S3Service();
            const expectedPath = 'reports/latest/index.html';
            const indexContent = await s3Service.getFile(expectedPath);
            expect(indexContent).toContain('<!DOCTYPE html>');
            console.log('✅ Reporte verificado correctamente en S3.');
        });
    });

    test('Falla al subir archivo si no tiene permisos', async () => {
        test.info().annotations.push({
            type: 'test_case',
            description: 'Verifica el manejo de errores de permisos al intentar subir reportes a S3'
        });

        await test.step('Dado que tengo un bucket sin permisos de escritura', async () => {
            // Setup inicial
        });

        await test.step('Cuando intento subir un archivo', async () => {
            const s3Service = new S3Service('sololectura');
            await expect(s3Service.uploadFile(
                'prohibido.txt',
                'no deberías ver esto',
                'text/plain'
            )).rejects.toThrow(/is not authorized to perform: s3:PutObject/);
        });

        await test.step('Entonces valido que se lanza un error de permisos', async () => {
            // La validación se realiza en el paso anterior
        });
    });
});