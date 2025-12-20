const express = require('express');
const axios = require('axios');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth');

router.post('/backup/export', authenticateToken, async (req, res) => {
    console.log('📦 Usuario exportando:', req.user?.email);
    console.log('📋 Request body:', req.body);
    
    const { format, table = 'all', sendEmail = false } = req.body;

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

        if (format === 'sql') {
            // Para SQL siempre usamos el endpoint dedicado
            workerUrl = 'http://pos_backup_worker:4000/generate-sql';
            method = 'POST';
            requestData = { 
                sendEmail: sendEmail,
                email: req.user?.email || null 
            };
            console.log('🔧 Generando SQL backup...');
        } else {
            // Para otros formatos usamos export-data
            workerUrl = `http://pos_backup_worker:4000/export-data?format=${format}&table=${table}`;
            method = 'GET';
            console.log('📊 Exportando datos en formato:', format);
        }

        console.log('🔗 Worker URL:', workerUrl);
        console.log('📨 Método:', method);

        const response = await axios({
            url: workerUrl,
            method: method,
            data: method === 'POST' ? requestData : undefined,
            responseType: 'stream',
            timeout: 120000, // 2 minutos
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            validateStatus: (status) => status < 500 // No lanzar error en 4xx
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

        // Copiar headers importantes del worker
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

        // Pipe del stream con manejo de errores
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
        });

        // Iniciar el pipe
        response.data.pipe(res);

    } catch (error) {
        console.error('❌ Error comunicación worker:', {
            message: error.message,
            code: error.code,
            response: error.response?.status
        });
        
        // Distinguir tipos de error
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

module.exports = router;