// backup/backup.js - ENDPOINT ACTUALIZADO
const express = require('express');
const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const nodemailer = require('nodemailer');
const ExcelJS = require('exceljs'); // ← NUEVA IMPORTACIÓN
require('dotenv').config();
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 5432,
    ssl: { rejectUnauthorized: false }
});

const backupDir = path.join(__dirname, 'backups');
fs.ensureDirSync(backupDir);

const ALLOWED_TABLES = [
    'categorias', 'clientes', 'compras', 'comprobantes',
    'detalle_compras', 'detalle_ventas', 'facturas',
    'marcas', 'productos', 'proveedores', 'ventas'
];

async function sendBackupEmail(filePath, fileName, targetEmail) {
    let transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });

    await transporter.sendMail({
        from: `"Sistema POS - Backup" <${process.env.SMTP_USER}>`,
        to: targetEmail || process.env.BACKUP_EMAIL_RECIPIENT,
        subject: `Exportación de Datos - ${fileName}`,
        text: `Se adjunta el archivo solicitado de la base de datos.`,
        attachments: [{ filename: fileName, path: filePath }]
    });
}

// ENDPOINT: Exportar datos con ExcelJS (ACTUALIZADO)
app.get('/export-data', async (req, res) => {
    const { format, table } = req.query;

    try {
        // Determinar qué tablas exportar
        let tablesToExport = [];

        if (table === 'all') {
            tablesToExport = ALLOWED_TABLES;
        } else if (table && table.includes(',')) {
            // Múltiples tablas separadas por coma
            tablesToExport = table.split(',')
                .map(t => t.trim())
                .filter(t => ALLOWED_TABLES.includes(t));

            if (tablesToExport.length === 0) {
                return res.status(400).json({ error: 'No se especificaron tablas válidas' });
            }
        } else if (table && ALLOWED_TABLES.includes(table)) {
            // Una sola tabla
            tablesToExport = [table];
        } else {
            return res.status(400).json({ error: 'Tabla no válida o no especificada' });
        }

        const exportData = {};

        // Recolectar datos de las tablas seleccionadas
        for (const tableName of tablesToExport) {
            let query = `SELECT * FROM ${tableName}`;

            if (tableName === 'comprobantes') {
                query = `SELECT id, tipo, serie, numero, cliente_id, subtotal, igv, total, fecha, estado FROM comprobantes`;
            }

            const result = await pool.query(query);
            exportData[tableName] = result.rows;
        }

        // Exportar según formato
        if (format === 'json') {
            const fileName = tablesToExport.length === 1
                ? `${tablesToExport[0]}_${Date.now()}.json`
                : `backup_${tablesToExport.length}_tablas_${Date.now()}.json`;

            res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
            res.set('Content-Type', 'application/json');
            return res.send(JSON.stringify(exportData, null, 2));
        }

        if (format === 'csv') {
            // Para CSV con múltiples tablas, crear un ZIP o un solo CSV concatenado
            // Por simplicidad, si hay múltiples tablas, usaremos XLSX
            if (tablesToExport.length > 1) {
                return res.status(400).json({
                    error: 'CSV solo soporta una tabla. Use XLSX para múltiples tablas.'
                });
            }

            const tableName = tablesToExport[0];
            const data = exportData[tableName];

            if (!data || data.length === 0) {
                return res.status(404).json({ error: 'No hay datos en la tabla seleccionada' });
            }

            // Generar CSV simple
            const headers = Object.keys(data[0]);
            const csvRows = [headers.join(',')];

            data.forEach(row => {
                const values = headers.map(header => {
                    const value = row[header];
                    // Escapar comillas y valores con comas
                    if (value === null || value === undefined) return '';
                    const stringValue = String(value);
                    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                });
                csvRows.push(values.join(','));
            });

            const csvContent = csvRows.join('\n');
            const fileName = `${tableName}_${Date.now()}.csv`;

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
            return res.send('\ufeff' + csvContent); // BOM para UTF-8
        }

        if (format === 'xlsx') {
            // Crear un nuevo libro de Excel con ExcelJS
            const workbook = new ExcelJS.Workbook();

            workbook.creator = 'Sistema POS';
            workbook.created = new Date();

            // Agregar cada tabla como una hoja separada
            for (const tableName of tablesToExport) {
                const data = exportData[tableName];

                if (data && data.length > 0) {
                    // Crear hoja con el nombre de la tabla
                    const worksheet = workbook.addWorksheet(tableName);

                    // Obtener las columnas del primer registro
                    const columns = Object.keys(data[0]).map(key => ({
                        header: key.toUpperCase(),
                        key: key,
                        width: 15
                    }));

                    worksheet.columns = columns;

                    // Estilizar el encabezado
                    worksheet.getRow(1).font = { bold: true, size: 12 };
                    worksheet.getRow(1).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FF4472C4' }
                    };
                    worksheet.getRow(1).font.color = { argb: 'FFFFFFFF' };
                    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
                    worksheet.getRow(1).height = 20;

                    // Agregar los datos
                    data.forEach(row => {
                        worksheet.addRow(row);
                    });

                    // Aplicar bordes a todas las celdas con datos
                    worksheet.eachRow((row, rowNumber) => {
                        row.eachCell((cell) => {
                            cell.border = {
                                top: { style: 'thin' },
                                left: { style: 'thin' },
                                bottom: { style: 'thin' },
                                right: { style: 'thin' }
                            };
                        });
                    });

                    // Agregar autofiltro
                    worksheet.autoFilter = {
                        from: { row: 1, column: 1 },
                        to: { row: data.length + 1, column: columns.length }
                    };
                }
            }

            // Generar el archivo Excel
            const fileName = tablesToExport.length === 1
                ? `${tablesToExport[0]}_${Date.now()}.xlsx`
                : `backup_${tablesToExport.length}_tablas_${Date.now()}.xlsx`;

            const filePath = path.join(backupDir, fileName);

            await workbook.xlsx.writeFile(filePath);

            // Enviar el archivo y eliminarlo después
            res.download(filePath, fileName, (err) => {
                if (!err) {
                    fs.remove(filePath).catch(console.error);
                }
            });

            return;
        }

        // Fallback para otros formatos
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-disposition', 'attachment; filename=backup.json');
        return res.json(exportData);

    } catch (err) {
        console.error('Error exportando:', err);
        res.status(500).json({ error: 'Error interno al consultar la base de datos' });
    }
});


app.post('/generate-sql', async (req, res) => {
    console.log('🔧 [WORKER] Generando backup SQL...');

    try {
        const tables = [
            'categorias', 'clientes', 'compras', 'comprobantes',
            'detalle_compras', 'detalle_ventas', 'facturas',
            'marcas', 'productos', 'proveedores', 'ventas'
        ];

        let sqlDump = `-- =============================================\n`;
        sqlDump += `-- Backup SQL generado: ${new Date().toISOString()}\n`;
        sqlDump += `-- Sistema POS\n`;
        sqlDump += `-- =============================================\n\n`;

        // Por cada tabla
        for (const table of tables) {
            console.log(`📊 [WORKER] Procesando tabla: ${table}`);

            sqlDump += `\n-- Tabla: ${table}\n`;
            sqlDump += `-- =============================================\n\n`;

            try {
                // Obtener datos de la tabla
                const result = await pool.query(`SELECT * FROM ${table} ORDER BY id`);

                if (result.rows.length === 0) {
                    sqlDump += `-- Sin datos en ${table}\n\n`;
                    continue;
                }

                //console.log(`   ${result.rows.length} registros encontrados`);

                // Obtener nombres de columnas
                const columns = Object.keys(result.rows[0]);

                // Generar INSERTs
                for (const row of result.rows) {
                    const values = columns.map(col => {
                        const val = row[col];
                        if (val === null) return 'NULL';
                        if (typeof val === 'number') return val;
                        if (typeof val === 'boolean') return val;
                        if (val instanceof Date) return `'${val.toISOString()}'`;
                        // Escapar comillas simples y caracteres especiales
                        const escaped = String(val)
                            .replace(/\\/g, '\\\\')
                            .replace(/'/g, "''")
                            .replace(/\n/g, '\\n')
                            .replace(/\r/g, '\\r');
                        return `'${escaped}'`;
                    });

                    sqlDump += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
                }

                sqlDump += `\n`;

            } catch (tableError) {
                //console.error(` [WORKER] Error en tabla ${table}:`, tableError.message);
                sqlDump += `-- ERROR en tabla ${table}: ${tableError.message}\n\n`;
            }
        }

        const sizeKB = (Buffer.byteLength(sqlDump) / 1024).toFixed(2);
        //console.log(` [WORKER] SQL generado: ${sizeKB} KB`);

        // Configurar headers
        const filename = `backup_${Date.now()}.sql`;
        res.setHeader('Content-Type', 'application/x-sql; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', Buffer.byteLength(sqlDump));

        // Enviar
        res.send(sqlDump);

        //console.log(' [WORKER] SQL enviado al cliente');

    } catch (error) {
        //console.error(' [WORKER] Error generando SQL:', error);

        if (!res.headersSent) {
            res.status(500).json({
                error: 'Error generando backup SQL',
                details: error.message
            });
        }
    }
});

// Endpoint de health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Worker escuchando en puerto ${PORT}`);
});