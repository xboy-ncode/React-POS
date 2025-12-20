const express = require('express');
const axios = require('axios');
const router = express.Router();
const multer = require('multer');

const { authenticateToken } = require('../middleware/auth');



const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB máximo
    },
    fileFilter: (req, file, cb) => {
        const allowedExtensions = ['.sql', '.json', '.csv', '.xlsx'];
        const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
        
        if (allowedExtensions.includes(fileExtension)) {
            cb(null, true);
        } else {
            cb(new Error('Formato de archivo no soportado. Use SQL, JSON, CSV o XLSX'));
        }
    }
});




router.post('/backup/export', authenticateToken, async (req, res) => {
    console.log('📦 Usuario exportando:', req.user?.email);
    console.log('📋 Request body:', req.body);
    
    const { format, table = 'all', sendEmail = false, downloadFile = true, email } = req.body;

    // Validación de formato
    const validFormats = ['sql', 'json', 'csv', 'xlsx'];
    if (!validFormats.includes(format)) {
        return res.status(400).json({ 
            error: `Formato inválido. Use: ${validFormats.join(', ')}` 
        });
    }

    try {
        let workerUrl = '';
        let method = 'GET';
        let requestData = {};

        // Determinar el email del usuario o usar el proporcionado
        const targetEmail = email || req.user?.email || process.env.BACKUP_EMAIL_RECIPIENT;

        console.log('🔍 Parámetros recibidos:', {
            sendEmail,
            downloadFile,
            targetEmail
        });

        if (format === 'sql') {
            // Para SQL siempre usamos el endpoint dedicado
            workerUrl = 'http://pos_backup_worker:4000/generate-sql';
            method = 'POST';
            requestData = { 
                sendEmail: sendEmail,
                downloadFile: downloadFile,
                email: targetEmail
            };
            console.log('🔧 Generando SQL backup...');
        } else {
            // Para otros formatos usamos export-data
            const params = new URLSearchParams({
                format: format,
                table: table
            });

            // Agregar parámetros de email y descarga
            if (sendEmail) {
                params.append('sendEmail', 'true');
                if (targetEmail) {
                    params.append('email', targetEmail);
                }
            }

            // ✨ NUEVO: Parámetro para controlar descarga
            params.append('downloadFile', downloadFile ? 'true' : 'false');

            workerUrl = `http://pos_backup_worker:4000/export-data?${params.toString()}`;
            method = 'GET';
            console.log('📊 Exportando datos en formato:', format);
        }

        console.log('🔗 Worker URL:', workerUrl);
        console.log('📨 Método:', method);
        console.log('📧 Enviar email:', sendEmail);
        console.log('💾 Descargar archivo:', downloadFile);

        // Si NO se debe descargar, cambiar el responseType
        const responseType = downloadFile ? 'stream' : 'json';

        const response = await axios({
            url: workerUrl,
            method: method,
            data: method === 'POST' ? requestData : undefined,
            responseType: responseType,
            timeout: 120000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            validateStatus: (status) => status < 500
        });

        console.log('✅ Worker respondió:', {
            status: response.status,
            contentType: response.headers['content-type']
        });

        // Si el worker respondió con error
        if (response.status >= 400) {
            console.error('❌ Worker retornó error:', response.status);
            return res.status(response.status).json({ 
                error: 'Error en el servicio de backup' 
            });
        }

        // Si NO se debe descargar, devolver solo la confirmación JSON
        if (!downloadFile) {
            console.log('✅ Solo email, no descarga. Retornando confirmación.');
            return res.json(response.data);
        }

        // Si se debe descargar, hacer pipe del stream
        const contentType = response.headers['content-type'];
        const contentDisposition = response.headers['content-disposition'];
        const contentLength = response.headers['content-length'];

        if (contentType) {
            res.setHeader('Content-Type', contentType);
            console.log('📄 Content-Type:', contentType);
        }
        
        if (contentDisposition) {
            res.setHeader('Content-Disposition', contentDisposition);
            console.log('📎 Content-Disposition:', contentDisposition);
        }

        if (contentLength) {
            res.setHeader('Content-Length', contentLength);
            console.log('📏 Content-Length:', contentLength);
        }

        // Pipe del stream
        let bytesTransferred = 0;

        response.data.on('data', (chunk) => {
            bytesTransferred += chunk.length;
        });

        response.data.on('error', (streamError) => {
            console.error('❌ Error en stream del worker:', streamError);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error al transmitir el archivo' });
            } else {
                res.end();
            }
        });

        response.data.on('end', () => {
            console.log(`✅ Stream completado: ${(bytesTransferred / 1024).toFixed(2)} KB transferidos`);
            if (sendEmail) {
                console.log('✅ Email enviado');
            }
        });

        response.data.pipe(res);

    } catch (error) {
        console.error('❌ Error comunicación worker:', {
            message: error.message,
            code: error.code,
            response: error.response?.status
        });
        
        if (error.code === 'ECONNREFUSED') {
            console.error('🔌 Worker no disponible en pos_backup_worker:4000');
            if (!res.headersSent) {
                return res.status(503).json({ 
                    error: 'Servicio de backup no disponible',
                    details: 'No se pudo conectar al worker'
                });
            }
        }

        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
            console.error('⏱️ Timeout conectando con worker');
            if (!res.headersSent) {
                return res.status(504).json({ 
                    error: 'Timeout generando el backup',
                    details: 'Intente con menos tablas o contacte al administrador'
                });
            }
        }

        if (!res.headersSent) {
            res.status(500).json({ 
                error: 'Error generando backup',
                details: error.message 
            });
        } else {
            res.end();
        }
    }
});


router.post('/backup/restore', authenticateToken, upload.single('file'), async (req, res) => {
    console.log('📥 Usuario restaurando base de datos:', req.user?.email);
    
    try {
        // Validar que se subió un archivo
        if (!req.file) {
            return res.status(400).json({ 
                error: 'No se proporcionó ningún archivo' 
            });
        }

        const { clearBefore = 'false' } = req.body;
        const file = req.file;

        console.log('📄 Archivo recibido:', {
            nombre: file.originalname,
            tamaño: file.size,
            tipo: file.mimetype,
            limpiarAntes: clearBefore
        });

        // Detectar formato del archivo
        const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
        let format;
        
        switch (fileExtension) {
            case '.sql': format = 'sql'; break;
            case '.json': format = 'json'; break;
            case '.csv': format = 'csv'; break;
            case '.xlsx': format = 'xlsx'; break;
            default:
                return res.status(400).json({ 
                    error: 'Formato de archivo no reconocido' 
                });
        }

        console.log('🔍 Formato detectado:', format);

        // Enviar al worker de backup
        const workerUrl = 'http://pos_backup_worker:4000/restore-data';

        console.log('📤 Enviando al worker:', workerUrl);

        const response = await axios({
            url: workerUrl,
            method: 'POST',
            data: {
                format: format,
                fileData: file.buffer.toString('base64'), // Convertir buffer a base64
                fileName: file.originalname,
                clearBefore: clearBefore === 'true' || clearBefore === true,
                userEmail: req.user?.email
            },
            timeout: 300000, // 5 minutos
            validateStatus: (status) => status < 500
        });

        console.log('✅ Worker respondió:', {
            status: response.status,
            data: response.data
        });

        // Si el worker respondió con error
        if (response.status >= 400) {
            console.error('❌ Worker retornó error:', response.status);
            return res.status(response.status).json(
                response.data || { error: 'Error en el servicio de restauración' }
            );
        }

        // Retornar respuesta exitosa
        return res.json(response.data);

    } catch (error) {
        console.error('❌ Error en restauración:', {
            message: error.message,
            code: error.code,
            response: error.response?.status
        });

        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({ 
                error: 'Servicio de restauración no disponible',
                details: 'No se pudo conectar al worker'
            });
        }

        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
            return res.status(504).json({ 
                error: 'Timeout restaurando la base de datos',
                details: 'El archivo puede ser demasiado grande o el servidor está ocupado'
            });
        }

        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({ 
                    error: 'Archivo demasiado grande',
                    details: 'El tamaño máximo permitido es 100MB'
                });
            }
        }

        return res.status(500).json({ 
            error: 'Error al restaurar la base de datos',
            details: error.message 
        });
    }
});




module.exports = router;