// backup/backup.js - CORREGIDO PARA MANEJAR "SOLO EMAIL"
const express = require('express');
const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const nodemailer = require('nodemailer');
const ExcelJS = require('exceljs');
require('dotenv').config();
const { Pool } = require('pg');
const Papa = require('papaparse');
 

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
    console.log('📧 Preparando envío de email...');
    console.log('   Destinatario:', targetEmail);
    console.log('   Archivo:', fileName);
    
    let transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true,
        auth: { 
            user: process.env.SMTP_USER, 
            pass: process.env.SMTP_PASS 
        }
    });

    const mailOptions = {
        from: `"Sistema POS - Backup" <${process.env.SMTP_USER}>`,
        to: targetEmail || process.env.BACKUP_EMAIL_RECIPIENT,
        subject: `Exportación de Datos - ${fileName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">📦 Backup de Base de Datos</h2>
                <p>Se ha generado exitosamente el archivo de exportación solicitado.</p>
                
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Archivo:</strong> ${fileName}</p>
                    <p style="margin: 5px 0;"><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
                    <p style="margin: 5px 0;"><strong>Tamaño:</strong> ${(fs.statSync(filePath).size / 1024).toFixed(2)} KB</p>
                </div>
                
                <p style="color: #6b7280; font-size: 14px;">
                    Este archivo contiene datos sensibles. Por favor, manéjalo con cuidado.
                </p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                
                <p style="color: #9ca3af; font-size: 12px;">
                    Sistema POS - Backup Automatizado<br>
                    No responder a este correo.
                </p>
            </div>
        `,
        attachments: [{ 
            filename: fileName, 
            path: filePath 
        }]
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado exitosamente');
}

// ENDPOINT: Exportar datos con ExcelJS (CORREGIDO PARA SOLO EMAIL)
app.get('/export-data', async (req, res) => {
    const { format, table, sendEmail, email, downloadFile } = req.query;

    try {
        // Determinar qué tablas exportar
        let tablesToExport = [];

        if (table === 'all') {
            tablesToExport = ALLOWED_TABLES;
        } else if (table && table.includes(',')) {
            tablesToExport = table.split(',')
                .map(t => t.trim())
                .filter(t => ALLOWED_TABLES.includes(t));

            if (tablesToExport.length === 0) {
                return res.status(400).json({ error: 'No se especificaron tablas válidas' });
            }
        } else if (table && ALLOWED_TABLES.includes(table)) {
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

        // Determinar acciones
        const shouldSendEmail = sendEmail === 'true' || sendEmail === '1';
        const shouldDownload = downloadFile === 'true' || downloadFile === '1' || downloadFile === undefined;
        const targetEmail = email || process.env.BACKUP_EMAIL_RECIPIENT;

        console.log('🔍 Configuración:', {
            shouldSendEmail,
            shouldDownload,
            targetEmail
        });

        // Exportar según formato
        if (format === 'json') {
            const fileName = tablesToExport.length === 1
                ? `${tablesToExport[0]}_${Date.now()}.json`
                : `backup_${tablesToExport.length}_tablas_${Date.now()}.json`;

            const jsonContent = JSON.stringify(exportData, null, 2);

            // Si se solicita email
            if (shouldSendEmail) {
                const filePath = path.join(backupDir, fileName);
                fs.writeFileSync(filePath, jsonContent);
                
                try {
                    await sendBackupEmail(filePath, fileName, targetEmail);
                    fs.removeSync(filePath);
                } catch (emailError) {
                    console.error('❌ Error enviando email:', emailError);
                    fs.removeSync(filePath);
                    return res.status(500).json({ 
                        error: 'Error enviando email',
                        details: emailError.message 
                    });
                }
            }

            // Si NO debe descargar, solo enviar confirmación
            if (!shouldDownload) {
                return res.json({ 
                    success: true, 
                    message: 'Backup enviado por email exitosamente',
                    tables: tablesToExport.length
                });
            }

            // Si debe descargar, enviar el archivo
            res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
            res.set('Content-Type', 'application/json');
            return res.send(jsonContent);
        }

        if (format === 'csv') {
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

            // Generar CSV
            const headers = Object.keys(data[0]);
            const csvRows = [headers.join(',')];

            data.forEach(row => {
                const values = headers.map(header => {
                    const value = row[header];
                    if (value === null || value === undefined) return '';
                    const stringValue = String(value);
                    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                });
                csvRows.push(values.join(','));
            });

            const csvContent = '\ufeff' + csvRows.join('\n');
            const fileName = `${tableName}_${Date.now()}.csv`;

            // Si se solicita email
            if (shouldSendEmail) {
                const filePath = path.join(backupDir, fileName);
                fs.writeFileSync(filePath, csvContent);
                
                try {
                    await sendBackupEmail(filePath, fileName, targetEmail);
                    fs.removeSync(filePath);
                } catch (emailError) {
                    console.error('❌ Error enviando email:', emailError);
                    fs.removeSync(filePath);
                    return res.status(500).json({ 
                        error: 'Error enviando email',
                        details: emailError.message 
                    });
                }
            }

            // Si NO debe descargar, solo enviar confirmación
            if (!shouldDownload) {
                return res.json({ 
                    success: true, 
                    message: 'Backup enviado por email exitosamente',
                    tables: tablesToExport.length
                });
            }

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
            return res.send(csvContent);
        }

        if (format === 'xlsx') {
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Sistema POS';
            workbook.created = new Date();

            // Agregar cada tabla como una hoja separada
            for (const tableName of tablesToExport) {
                const data = exportData[tableName];

                if (data && data.length > 0) {
                    const worksheet = workbook.addWorksheet(tableName);
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

                    data.forEach(row => {
                        worksheet.addRow(row);
                    });

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

                    worksheet.autoFilter = {
                        from: { row: 1, column: 1 },
                        to: { row: data.length + 1, column: columns.length }
                    };
                }
            }

            const fileName = tablesToExport.length === 1
                ? `${tablesToExport[0]}_${Date.now()}.xlsx`
                : `backup_${tablesToExport.length}_tablas_${Date.now()}.xlsx`;

            const filePath = path.join(backupDir, fileName);
            await workbook.xlsx.writeFile(filePath);

            // Si se solicita email
            if (shouldSendEmail) {
                try {
                    await sendBackupEmail(filePath, fileName, targetEmail);
                } catch (emailError) {
                    console.error('❌ Error enviando email:', emailError);
                }
            }

            // Si NO debe descargar, solo enviar confirmación
            if (!shouldDownload) {
                fs.removeSync(filePath); // Limpiar archivo
                return res.json({ 
                    success: true, 
                    message: 'Backup enviado por email exitosamente',
                    tables: tablesToExport.length
                });
            }

            // Si debe descargar, enviar el archivo
            res.download(filePath, fileName, (err) => {
                if (!err) {
                    fs.remove(filePath).catch(console.error);
                }
            });

            return;
        }

        // Fallback
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
    
    const { sendEmail, email, downloadFile } = req.body || {};

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

        for (const table of tables) {
            console.log(`📊 [WORKER] Procesando tabla: ${table}`);

            sqlDump += `\n-- Tabla: ${table}\n`;
            sqlDump += `-- =============================================\n\n`;

            try {
                const result = await pool.query(`SELECT * FROM ${table}`);

                if (result.rows.length === 0) {
                    sqlDump += `-- Sin datos en ${table}\n\n`;
                    continue;
                }

                const columns = Object.keys(result.rows[0]);

                for (const row of result.rows) {
                    const values = columns.map(col => {
                        const val = row[col];
                        
                        // NULL
                        if (val === null || val === undefined) {
                            return 'NULL';
                        }
                        
                        // Boolean
                        if (typeof val === 'boolean') {
                            return val ? 'true' : 'false';
                        }
                        
                        // Number
                        if (typeof val === 'number') {
                            return val;
                        }
                        
                        // Date
                        if (val instanceof Date) {
                            return `'${val.toISOString()}'`;
                        }
                        
                        // JSON/Object (para campos JSONB)
                        if (typeof val === 'object') {
                            const jsonStr = JSON.stringify(val)
                                .replace(/\\/g, '\\\\')
                                .replace(/'/g, "''");
                            return `'${jsonStr}'`;
                        }
                        
                        // String - ESCAPADO MEJORADO
                        const stringVal = String(val)
                            .replace(/\\/g, '\\\\')    // Backslashes primero
                            .replace(/'/g, "''")       // Comillas simples
                            .replace(/\n/g, '\\n')     // Saltos de línea
                            .replace(/\r/g, '\\r')     // Retorno de carro
                            .replace(/\t/g, '\\t')     // Tabs
                            .replace(/\0/g, '\\0');    // Null bytes
                        
                        return `'${stringVal}'`;
                    });

                    sqlDump += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
                }

                sqlDump += `\n`;

            } catch (tableError) {
                console.error(`❌ Error en tabla ${table}:`, tableError.message);
                sqlDump += `-- ERROR en tabla ${table}: ${tableError.message}\n\n`;
            }
        }

        const sizeKB = (Buffer.byteLength(sqlDump) / 1024).toFixed(2);
        console.log(`✅ [WORKER] SQL generado: ${sizeKB} KB`);

        const filename = `backup_${Date.now()}.sql`;
        const shouldSendEmail = sendEmail === true || sendEmail === 'true';
        const shouldDownload = downloadFile === true || downloadFile === 'true' || downloadFile === undefined;

        if (shouldSendEmail) {
            const filePath = path.join(backupDir, filename);
            fs.writeFileSync(filePath, sqlDump);
            
            try {
                const targetEmail = email || process.env.BACKUP_EMAIL_RECIPIENT;
                await sendBackupEmail(filePath, filename, targetEmail);
                console.log('✅ [WORKER] Email enviado');
                fs.removeSync(filePath);
            } catch (emailError) {
                console.error('❌ [WORKER] Error enviando email:', emailError);
                fs.removeSync(filePath);
            }
        }

        if (!shouldDownload) {
            return res.json({ 
                success: true, 
                message: 'Backup SQL enviado por email exitosamente'
            });
        }

        res.setHeader('Content-Type', 'application/x-sql; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', Buffer.byteLength(sqlDump));
        res.send(sqlDump);

        console.log('✅ [WORKER] SQL enviado al cliente');

    } catch (error) {
        console.error('❌ [WORKER] Error generando SQL:', error);

        if (!res.headersSent) {
            res.status(500).json({
                error: 'Error generando backup SQL',
                details: error.message
            });
        }
    }
});


app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});







app.post('/restore-data', async (req, res) => {
    console.log('🔧 [WORKER] Iniciando restauración de datos...');
    
    const { format, fileData, fileName, clearBefore, userEmail } = req.body;

    try {
        // Validar datos recibidos
        if (!format || !fileData) {
            return res.status(400).json({
                success: false,
                error: 'Faltan datos requeridos (format, fileData)'
            });
        }

        console.log('📋 Datos de restauración:', {
            formato: format,
            archivo: fileName,
            limpiarAntes: clearBefore,
            usuario: userEmail
        });

        let result;

        switch (format) {
            case 'sql':
                result = await restoreFromSQL(fileData, clearBefore);
                break;
            case 'json':
                result = await restoreFromJSON(fileData, clearBefore);
                break;
            case 'csv':
                result = await restoreFromCSV(fileData, fileName, clearBefore);
                break;
            case 'xlsx':
                result = await restoreFromXLSX(fileData, clearBefore);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: `Formato no soportado: ${format}`
                });
        }

        console.log('✅ [WORKER] Restauración completada:', result);

        return res.json({
            success: true,
            message: 'Datos restaurados exitosamente',
            ...result
        });

    } catch (error) {
        console.error('❌ [WORKER] Error restaurando datos:', error);

        return res.status(500).json({
            success: false,
            error: 'Error al restaurar los datos',
            details: error.message
        });
    }
});

// ======================================================
// FUNCIONES AUXILIARES DE RESTAURACIÓN
// ======================================================

/**
 * Restaurar desde archivo SQL
 */
async function restoreFromSQL(base64Data, clearBefore) {
    console.log('🔵 Restaurando desde SQL...');
    
    const sqlContent = Buffer.from(base64Data, 'base64').toString('utf-8');
    
    // Parser mejorado de SQL
    const statements = sqlContent
        .split('\n')
        .filter(line => {
            const trimmed = line.trim();
            return trimmed.length > 0 && 
                   !trimmed.startsWith('--') && 
                   !trimmed.startsWith('/*');
        })
        .join('\n')
        .split(';')
        .map(s => s.trim())
        .filter(s => {
            const validKeywords = ['INSERT', 'UPDATE', 'DELETE'];
            const firstWord = s.split(/\s+/)[0]?.toUpperCase();
            return validKeywords.includes(firstWord);
        });

    console.log(`📊 ${statements.length} statements SQL detectados`);

    if (statements.length === 0) {
        console.warn('⚠️ No se encontraron statements SQL válidos');
        return {
            tablesRestored: 0,
            rowsInserted: 0,
            errors: [{ error: 'No se encontraron statements SQL válidos' }]
        };
    }

    let executed = 0;
    let updated = 0;
    let errors = [];

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Limpiar si es necesario
        if (clearBefore) {
            console.log('🗑️ Limpiando tablas existentes...');
            const tables = ['detalle_ventas', 'detalle_compras', 'facturas', 'ventas', 
                          'compras', 'productos', 'clientes', 'proveedores', 'marcas', 'categorias'];
            
            for (const table of tables) {
                try {
                    await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
                    console.log(`  ✓ ${table} limpiada`);
                } catch (err) {
                    console.warn(`  ⚠️ No se pudo limpiar ${table}`);
                }
            }
        }

        // Ejecutar statements con SAVEPOINT
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            const savepointName = `sp_sql_${i}_${Math.random().toString(36).substr(2, 9)}`;
            
            try {
                await client.query(`SAVEPOINT ${savepointName}`);
                await client.query(statement);
                await client.query(`RELEASE SAVEPOINT ${savepointName}`);
                executed++;
            } catch (err) {
                await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
                
                // 🎯 Si es duplicado Y es un INSERT, convertir a UPDATE usando parámetros
                if (err.code === '23505' && statement.toUpperCase().trim().startsWith('INSERT')) {
                    try {
                        // Parsear el INSERT manualmente
                        const insertMatch = statement.match(/INSERT INTO (\w+)\s*\((.*?)\)\s*VALUES\s*\((.*)\)/is);
                        
                        if (insertMatch) {
                            const [, table, columnsStr, valuesStr] = insertMatch;
                            const columns = columnsStr.split(',').map(c => c.trim());
                            
                            // Parsear valores (respetando comillas y paréntesis)
                            const values = parseValuesFromSQL(valuesStr);
                            
                            if (values.length !== columns.length) {
                                throw new Error('Mismatch entre columnas y valores');
                            }
                            
                            // Detectar PK
                            const pkColumn = columns.find(c => c.startsWith('id_') || c === 'id') || columns[0];
                            const pkIndex = columns.indexOf(pkColumn);
                            const pkValue = values[pkIndex];
                            
                            // Construir UPDATE con parámetros preparados
                            const updateColumns = [];
                            const updateValues = [];
                            
                            columns.forEach((col, idx) => {
                                if (idx !== pkIndex) {
                                    updateColumns.push(col);
                                    updateValues.push(parseSQLValue(values[idx]));
                                }
                            });
                            
                            // Agregar PK al final
                            updateValues.push(parseSQLValue(pkValue));
                            
                            const setClause = updateColumns
                                .map((col, idx) => `${col} = $${idx + 1}`)
                                .join(', ');
                            
                            const updateQuery = `UPDATE ${table} SET ${setClause} WHERE ${pkColumn} = $${updateValues.length}`;
                            
                            await client.query(updateQuery, updateValues);
                            await client.query(`RELEASE SAVEPOINT ${savepointName}`);
                            updated++;
                        } else {
                            throw new Error('No se pudo parsear el INSERT');
                        }
                    } catch (updateErr) {
                        await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
                        errors.push({
                            statement: statement.substring(0, 100) + '...',
                            error: `Falló conversión a UPDATE: ${updateErr.message}`
                        });
                    }
                } else {
                    await client.query(`RELEASE SAVEPOINT ${savepointName}`);
                    errors.push({
                        statement: statement.substring(0, 100) + '...',
                        error: err.message
                    });
                }
            }
        }

        await client.query('COMMIT');
        console.log(`✅ SQL ejecutado: ${executed} insertados, ${updated} actualizados, ${errors.length} errores`);

        return {
            tablesRestored: 'multiple',
            rowsInserted: executed,
            rowsUpdated: updated,
            errors: errors.length > 0 ? errors.slice(0, 10) : null
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// 🆕 FUNCIÓN AUXILIAR: Parsear valores de SQL VALUES (...)
function parseValuesFromSQL(valuesStr) {
    const values = [];
    let current = '';
    let inString = false;
    let stringChar = null;
    let depth = 0;
    let escaped = false;
    
    for (let i = 0; i < valuesStr.length; i++) {
        const char = valuesStr[i];
        const prevChar = i > 0 ? valuesStr[i - 1] : null;
        
        // Manejo de escape
        if (escaped) {
            current += char;
            escaped = false;
            continue;
        }
        
        if (char === '\\') {
            escaped = true;
            current += char;
            continue;
        }
        
        // Manejo de strings
        if ((char === "'" || char === '"') && !escaped) {
            if (!inString) {
                inString = true;
                stringChar = char;
                current += char;
            } else if (char === stringChar) {
                // Verificar si es escape '' dentro de string SQL
                if (valuesStr[i + 1] === char) {
                    current += char + char;
                    i++; // Skip next
                } else {
                    inString = false;
                    stringChar = null;
                    current += char;
                }
            } else {
                current += char;
            }
            continue;
        }
        
        if (inString) {
            current += char;
            continue;
        }
        
        // Manejo de paréntesis (para JSON)
        if (char === '{' || char === '[') {
            depth++;
            current += char;
            continue;
        }
        
        if (char === '}' || char === ']') {
            depth--;
            current += char;
            continue;
        }
        
        // Split por coma solo si no estamos en string ni en objeto
        if (char === ',' && depth === 0) {
            values.push(current.trim());
            current = '';
            continue;
        }
        
        current += char;
    }
    
    // Agregar último valor
    if (current.trim()) {
        values.push(current.trim());
    }
    
    return values;
}

// 🆕 FUNCIÓN AUXILIAR: Convertir valor SQL a tipo JS
function parseSQLValue(sqlValue) {
    const trimmed = sqlValue.trim();
    
    // NULL
    if (trimmed.toUpperCase() === 'NULL') {
        return null;
    }
    
    // Boolean
    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;
    
    // Number
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
        return parseFloat(trimmed);
    }
    
    // String (remover comillas externas)
    if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || 
        (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
        let str = trimmed.slice(1, -1);
        
        // Desescapar
        str = str
            .replace(/''/g, "'")      // '' → '
            .replace(/\\n/g, '\n')    // \n → newline
            .replace(/\\r/g, '\r')    // \r → carriage return
            .replace(/\\t/g, '\t')    // \t → tab
            .replace(/\\\\/g, '\\');  // \\ → \
        
        return str;
    }
    
    return trimmed;
}

/**
 * Restaurar desde archivo JSON con UPSERT inteligente
 */
async function restoreFromJSON(base64Data, clearBefore) {
    console.log('🟡 Restaurando desde JSON...');
    
    const jsonContent = Buffer.from(base64Data, 'base64').toString('utf-8');
    const data = JSON.parse(jsonContent);

    const TABLE_ORDER = [
        'categorias', 'marcas', 'proveedores', 'clientes',
        'productos', 'compras', 'ventas', 'facturas',
        'detalle_compras', 'detalle_ventas'
    ];

    let totalRows = 0;
    let totalUpdated = 0;
    let tablesProcessed = 0;
    let errors = [];

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Limpiar si es necesario
        if (clearBefore) {
            console.log('🗑️ Limpiando tablas existentes...');
            const reversedOrder = [...TABLE_ORDER].reverse();
            for (const table of reversedOrder) {
                if (data[table]) {
                    try {
                        await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
                        console.log(`  ✓ ${table} limpiada`);
                    } catch (err) {
                        console.warn(`  ⚠️ No se pudo limpiar ${table}:`, err.message);
                    }
                }
            }
        }

        // Insertar datos por cada tabla
        for (const tableName of TABLE_ORDER) {
            const rows = data[tableName];
            
            if (!rows || !Array.isArray(rows) || rows.length === 0) {
                continue;
            }

            console.log(`  📊 Procesando ${rows.length} filas en ${tableName}...`);

            let inserted = 0;
            let updated = 0;
            let skipped = 0;

            for (const row of rows) {
                const savepointName = `sp_json_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                
                try {
                    await client.query(`SAVEPOINT ${savepointName}`);

                    const columns = Object.keys(row);
                    const values = Object.values(row);
                    
                    const pkColumn = columns.find(c => 
                        c.startsWith('id_') || c === 'id'
                    ) || columns[0];
                    
                    const pkValue = row[pkColumn];

                    // Intentar INSERT
                    try {
                        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
                        const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
                        
                        await client.query(query, values);
                        await client.query(`RELEASE SAVEPOINT ${savepointName}`);
                        inserted++;
                        totalRows++;
                    } catch (insertError) {
                        await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
                        
                        if (insertError.code === '23505') {
                            const updateColumns = columns.filter(c => c !== pkColumn);
                            const updateValues = updateColumns.map(c => row[c]);
                            
                            if (updateColumns.length > 0) {
                                const setClause = updateColumns
                                    .map((col, i) => `${col} = $${i + 1}`)
                                    .join(', ');
                                
                                const updateQuery = `
                                    UPDATE ${tableName} 
                                    SET ${setClause} 
                                    WHERE ${pkColumn} = $${updateColumns.length + 1}
                                `;
                                
                                try {
                                    await client.query(updateQuery, [...updateValues, pkValue]);
                                    await client.query(`RELEASE SAVEPOINT ${savepointName}`);
                                    updated++;
                                    totalUpdated++;
                                } catch (updateError) {
                                    await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
                                    errors.push({
                                        table: tableName,
                                        error: `UPDATE falló: ${updateError.message}`
                                    });
                                    skipped++;
                                }
                            } else {
                                await client.query(`RELEASE SAVEPOINT ${savepointName}`);
                                skipped++;
                            }
                        } else {
                            await client.query(`RELEASE SAVEPOINT ${savepointName}`);
                            errors.push({
                                table: tableName,
                                error: insertError.message
                            });
                            skipped++;
                        }
                    }
                } catch (savepointError) {
                    errors.push({
                        table: tableName,
                        error: `SAVEPOINT: ${savepointError.message}`
                    });
                    skipped++;
                }
            }

            console.log(`  ✅ ${tableName}: ${inserted} insertadas, ${updated} actualizadas, ${skipped} omitidas`);
            tablesProcessed++;
        }

        await client.query('COMMIT');
        console.log(`✅ JSON restaurado: ${tablesProcessed} tablas, ${totalRows} filas nuevas, ${totalUpdated} actualizadas`);

        return {
            tablesRestored: tablesProcessed,
            rowsInserted: totalRows,
            rowsUpdated: totalUpdated,
            errors: errors.length > 0 ? errors.slice(0, 10) : null
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}
/**
 * Restaurar desde archivo CSV con UPSERT inteligente
 */
async function restoreFromCSV(base64Data, fileName, clearBefore) {
    console.log('🟠 Restaurando desde CSV...');
    
    const csvContent = Buffer.from(base64Data, 'base64').toString('utf-8');
    
    // Detectar nombre de tabla del archivo
    const tableName = fileName.replace('.csv', '').split('_')[0].toLowerCase();
    
    if (!ALLOWED_TABLES.includes(tableName)) {
        throw new Error(`Tabla no permitida: ${tableName}`);
    }

    // Parsear CSV
    const parsed = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true
    });

    if (parsed.errors.length > 0) {
        throw new Error(`Error parseando CSV: ${parsed.errors[0].message}`);
    }

    const rows = parsed.data;
    console.log(`  📊 ${rows.length} filas detectadas en CSV`);

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let errors = [];

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Limpiar tabla si es necesario
        if (clearBefore) {
            console.log(`🗑️ Limpiando tabla ${tableName}...`);
            await client.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE`);
        }

        // Insertar filas con SAVEPOINT
        for (const row of rows) {
            const savepointName = `sp_csv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            try {
                await client.query(`SAVEPOINT ${savepointName}`);

                const columns = Object.keys(row);
                const values = Object.values(row);
                
                // Detectar primary key
                const pkColumn = columns.find(c => 
                    c.startsWith('id_') || c === 'id'
                ) || columns[0];
                
                const pkValue = row[pkColumn];

                // Intentar INSERT
                try {
                    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
                    const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
                    
                    await client.query(query, values);
                    await client.query(`RELEASE SAVEPOINT ${savepointName}`);
                    inserted++;
                } catch (insertError) {
                    // Rollback al savepoint
                    await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
                    
                    // Si es duplicado, intentar UPDATE
                    if (insertError.code === '23505') {
                        const updateColumns = columns.filter(c => c !== pkColumn);
                        const updateValues = updateColumns.map(c => row[c]);
                        
                        if (updateColumns.length > 0) {
                            const setClause = updateColumns
                                .map((col, i) => `${col} = $${i + 1}`)
                                .join(', ');
                            
                            const updateQuery = `
                                UPDATE ${tableName} 
                                SET ${setClause} 
                                WHERE ${pkColumn} = $${updateColumns.length + 1}
                            `;
                            
                            try {
                                await client.query(updateQuery, [...updateValues, pkValue]);
                                await client.query(`RELEASE SAVEPOINT ${savepointName}`);
                                updated++;
                            } catch (updateError) {
                                await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
                                errors.push({ error: `UPDATE falló: ${updateError.message}` });
                                skipped++;
                            }
                        } else {
                            await client.query(`RELEASE SAVEPOINT ${savepointName}`);
                            skipped++;
                        }
                    } else {
                        // Otro error
                        await client.query(`RELEASE SAVEPOINT ${savepointName}`);
                        errors.push({ error: insertError.message });
                        skipped++;
                    }
                }
            } catch (savepointError) {
                console.error(`  ⚠️ Error en SAVEPOINT:`, savepointError.message);
                errors.push({ error: `SAVEPOINT: ${savepointError.message}` });
                skipped++;
            }
        }

        await client.query('COMMIT');
        console.log(`✅ CSV restaurado: ${inserted} insertadas, ${updated} actualizadas, ${skipped} omitidas en ${tableName}`);

        return {
            tablesRestored: 1,
            rowsInserted: inserted,
            rowsUpdated: updated,
            errors: errors.length > 0 ? errors : null
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Restaurar desde archivo XLSX usando ExcelJS
 */
/**
 * Restaurar desde archivo XLSX con manejo inteligente de dependencias
 */
/**
 * Restaurar desde archivo XLSX con manejo inteligente de dependencias y duplicados
 */
async function restoreFromXLSX(base64Data, clearBefore) {
    console.log('🟢 Restaurando desde XLSX...');
    
    const buffer = Buffer.from(base64Data, 'base64');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const TABLE_ORDER = [
        'categorias', 'marcas', 'proveedores', 'clientes',
        'productos', 'compras', 'ventas', 'facturas',
        'detalle_compras', 'detalle_ventas'
    ];

    let totalRows = 0;
    let tablesProcessed = 0;
    let errors = [];

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Limpiar si es necesario
        if (clearBefore) {
            console.log('🗑️ Limpiando datos existentes en orden correcto...');
            const reversedOrder = [...TABLE_ORDER].reverse();
            
            for (const tableName of reversedOrder) {
                try {
                    await client.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE`);
                    console.log(`  ✓ ${tableName} limpiada`);
                } catch (err) {
                    console.warn(`  ⚠️ No se pudo limpiar ${tableName}:`, err.message);
                }
            }
        }

        // Procesar tablas EN ORDEN
        for (const tableName of TABLE_ORDER) {
            const worksheet = workbook.getWorksheet(tableName);
            
            if (!worksheet) {
                console.log(`  ℹ️ Hoja "${tableName}" no encontrada`);
                continue;
            }

            const rows = [];
            const headers = [];
            
            const firstRow = worksheet.getRow(1);
            firstRow.eachCell((cell, colNumber) => {
                headers[colNumber] = cell.value?.toString().toLowerCase() || `col_${colNumber}`;
            });

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return;
                
                const rowData = {};
                row.eachCell((cell, colNumber) => {
                    const header = headers[colNumber];
                    if (header) {
                        rowData[header] = cell.value;
                    }
                });
                
                if (Object.keys(rowData).length > 0) {
                    rows.push(rowData);
                }
            });

            if (rows.length === 0) {
                console.log(`  ℹ️ Sin datos en ${tableName}`);
                continue;
            }

            console.log(`  📊 Procesando ${rows.length} filas en ${tableName}...`);

            let inserted = 0;
            let updated = 0;
            let skipped = 0;

            for (const row of rows) {
                // 🔥 CREAR SAVEPOINT ANTES DE CADA FILA
                const savepointName = `sp_${tableName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                
                try {
                    await client.query(`SAVEPOINT ${savepointName}`);

                    const columns = Object.keys(row);
                    const values = Object.values(row);
                    
                    const pkColumn = columns.find(c => 
                        c.startsWith('id_') || c === 'id'
                    ) || columns[0];
                    
                    const pkValue = row[pkColumn];

                    // Intentar INSERT
                    try {
                        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
                        const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
                        
                        await client.query(query, values);
                        await client.query(`RELEASE SAVEPOINT ${savepointName}`);
                        inserted++;
                        totalRows++;
                    } catch (insertError) {
                        // ✅ ROLLBACK al SAVEPOINT si falla
                        await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
                        
                        // Si es duplicado, intentar UPDATE
                        if (insertError.code === '23505') { 
                            const updateColumns = columns.filter(c => c !== pkColumn);
                            const updateValues = updateColumns.map(c => row[c]);
                            
                            if (updateColumns.length > 0) {
                                const setClause = updateColumns
                                    .map((col, i) => `${col} = $${i + 1}`)
                                    .join(', ');
                                
                                const updateQuery = `
                                    UPDATE ${tableName} 
                                    SET ${setClause} 
                                    WHERE ${pkColumn} = $${updateColumns.length + 1}
                                `;
                                
                                try {
                                    await client.query(updateQuery, [...updateValues, pkValue]);
                                    await client.query(`RELEASE SAVEPOINT ${savepointName}`);
                                    updated++;
                                } catch (updateError) {
                                    await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
                                    errors.push({
                                        table: tableName,
                                        error: `UPDATE falló: ${updateError.message}`,
                                        code: updateError.code
                                    });
                                    skipped++;
                                }
                            } else {
                                // Si no hay columnas para actualizar, solo skip
                                await client.query(`RELEASE SAVEPOINT ${savepointName}`);
                                skipped++;
                            }
                        } else {
                            // Otro tipo de error (como FK faltante)
                            await client.query(`RELEASE SAVEPOINT ${savepointName}`);
                            errors.push({
                                table: tableName,
                                error: insertError.message,
                                code: insertError.code,
                                pkValue: pkValue
                            });
                            skipped++;
                        }
                    }
                } catch (savepointError) {
                    // Error creando o manejando savepoint
                    console.error(`  ⚠️ Error en SAVEPOINT para fila:`, savepointError.message);
                    errors.push({
                        table: tableName,
                        error: `SAVEPOINT error: ${savepointError.message}`,
                        code: savepointError.code
                    });
                    skipped++;
                }
            }

            console.log(`  ✅ ${tableName}: ${inserted} insertadas, ${updated} actualizadas, ${skipped} omitidas`);
            tablesProcessed++;
        }

        await client.query('COMMIT');
        
        console.log(`✅ XLSX restaurado: ${tablesProcessed} tablas, ${totalRows} filas totales`);
        console.log(`   Errores encontrados: ${errors.length}`);

        return {
            tablesRestored: tablesProcessed,
            rowsInserted: totalRows,
            rowsUpdated: errors.filter(e => e.error.includes('UPDATE')).length,
            errors: errors.length > 0 ? errors.slice(0, 10) : null
        };

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error fatal en transacción:', error);
        throw error;
    } finally {
        client.release();
    }
}





const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Worker escuchando en puerto ${PORT}`);
});