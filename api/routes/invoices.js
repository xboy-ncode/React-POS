// routes/invoices.js
const express = require('express');
const Joi = require('joi');
const { pool } = require('../config/database');

const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validaciones
const createFacturaVentaSchema = Joi.object({
    id_venta: Joi.number().integer().required(),
    serie: Joi.string().max(4).required(),
    numero: Joi.number().integer().positive().required(),
    ruc_emisor: Joi.string().length(11).pattern(/^\d+$/).required(),
    razon_social_emisor: Joi.string().max(200).required(),
    direccion_emisor: Joi.string().allow(null, ''),
    ruc_receptor: Joi.string().length(11).pattern(/^\d+$/).allow(null),
    dni_receptor: Joi.string().length(8).pattern(/^\d+$/).allow(null),
    razon_social_receptor: Joi.string().max(200).allow(null, ''),
    direccion_receptor: Joi.string().allow(null, '')
});

const createFacturaCompraSchema = Joi.object({
    id_compra: Joi.number().integer().required(),
    serie: Joi.string().max(4).required(),
    numero: Joi.number().integer().positive().required(),
    ruc_emisor: Joi.string().length(11).pattern(/^\d+$/).required(),
    razon_social_emisor: Joi.string().max(200).required(),
    direccion_emisor: Joi.string().allow(null, ''),
    ruc_receptor: Joi.string().length(11).pattern(/^\d+$/).required(),
    razon_social_receptor: Joi.string().max(200).required(),
    direccion_receptor: Joi.string().allow(null, '')
});

// GET - Listar facturas con filtros y paginación
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            tipo = '', 
            fecha_desde = '', 
            fecha_hasta = '', 
            serie = '' 
        } = req.query;

        const limitNum = parseInt(limit, 10);
        const offsetNum = (parseInt(page, 10) - 1) * limitNum;

        let query = `
            SELECT f.*,
                   CASE 
                       WHEN f.tipo = 'VENTA' THEN CONCAT(c.nombre, ' ', c.apellido_paterno, ' ', c.apellido_materno)
                       ELSE p.razon_social 
                   END as cliente_proveedor,
                   CASE 
                       WHEN f.tipo = 'VENTA' THEN c.dni
                       ELSE p.ruc 
                   END as documento
            FROM facturas f
            LEFT JOIN ventas v ON f.id_venta = v.id_venta
            LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
            LEFT JOIN compras comp ON f.id_compra = comp.id_compra
            LEFT JOIN proveedores p ON comp.id_proveedor = p.id_proveedor
        `;

        let countQuery = `SELECT COUNT(*) FROM facturas f`;

        const conditions = [];
        const queryParams = [];
        let paramCount = 1;

        if (tipo) {
            conditions.push(`f.tipo = $${paramCount}`);
            queryParams.push(tipo.toUpperCase());
            paramCount++;
        }

        if (fecha_desde) {
            conditions.push(`f.fecha >= $${paramCount}`);
            queryParams.push(fecha_desde);
            paramCount++;
        }

        if (fecha_hasta) {
            conditions.push(`f.fecha <= $${paramCount}`);
            queryParams.push(fecha_hasta + ' 23:59:59');
            paramCount++;
        }

        if (serie) {
            conditions.push(`f.serie ILIKE $${paramCount}`);
            queryParams.push(`%${serie}%`);
            paramCount++;
        }

        if (conditions.length > 0) {
            const whereClause = ` WHERE ${conditions.join(' AND ')}`;
            query += whereClause;
            countQuery += whereClause;
        }

        query += ` ORDER BY f.fecha DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        queryParams.push(limitNum, offsetNum);

        const [result, countResult] = await Promise.all([
            pool.query(query, queryParams),
            pool.query(countQuery, queryParams.slice(0, -2))
        ]);

        const total = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(total / limitNum);

        res.json({
            facturas: result.rows,
            pagination: {
                page: parseInt(page),
                limit: limitNum,
                total,
                totalPages,
                hasNext: parseInt(page) < totalPages,
                hasPrev: parseInt(page) > 1
            }
        });
    } catch (error) {
        console.error('Error al obtener facturas:', error);
        res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
});


// GET - Obtener factura por ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const facturaResult = await pool.query(`
            SELECT f.*,
                   CASE 
                       WHEN f.tipo = 'VENTA' THEN v.id_venta
                       ELSE comp.id_compra 
                   END as operacion_id,
                   CASE 
                       WHEN f.tipo = 'VENTA' THEN CONCAT(c.nombre, ' ', c.apellido_paterno, ' ', c.apellido_materno)
                       ELSE p.razon_social 
                   END as cliente_proveedor,
                   CASE 
                       WHEN f.tipo = 'VENTA' THEN c.dni
                       ELSE p.ruc 
                   END as documento_cliente_proveedor
            FROM facturas f
            LEFT JOIN ventas v ON f.id_venta = v.id_venta
            LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
            LEFT JOIN compras comp ON f.id_compra = comp.id_compra
            LEFT JOIN proveedores p ON comp.id_proveedor = p.id_proveedor
            WHERE f.id_factura = $1
        `, [id]);

        if (facturaResult.rows.length === 0) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }

        const factura = facturaResult.rows[0];

        // Obtener detalles según el tipo
        let detalles = [];
        if (factura.tipo === 'VENTA' && factura.id_venta) {
            const detalleResult = await pool.query(`
                SELECT dv.*, p.nombre as producto_nombre
                FROM detalle_ventas dv
                LEFT JOIN productos p ON dv.id_producto = p.id_producto
                WHERE dv.id_venta = $1
                ORDER BY dv.id_detalle
            `, [factura.id_venta]);
            detalles = detalleResult.rows;
        } else if (factura.tipo === 'COMPRA' && factura.id_compra) {
            const detalleResult = await pool.query(`
                SELECT dc.*, p.nombre as producto_nombre
                FROM detalle_compras dc
                LEFT JOIN productos p ON dc.id_producto = p.id_producto
                WHERE dc.id_compra = $1
                ORDER BY dc.id_detalle
            `, [factura.id_compra]);
            detalles = detalleResult.rows;
        }

        factura.detalles = detalles;

        res.json(factura);
    } catch (error) {
        console.error('Error al obtener factura:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST - Crear factura de venta
router.post('/venta', authenticateToken, async (req, res) => {
    const client = await pool.connect();

    try {
        const { error } = createFacturaVentaSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const {
            id_venta,
            serie,
            numero,
            ruc_emisor,
            razon_social_emisor,
            direccion_emisor,
            ruc_receptor,
            dni_receptor,
            razon_social_receptor,
            direccion_receptor
        } = req.body;

        await client.query('BEGIN');

        // Verificar que la venta existe y obtener su total y moneda
        const ventaResult = await client.query(
            'SELECT total, moneda FROM ventas WHERE id_venta = $1',
            [id_venta]
        );

        if (ventaResult.rows.length === 0) {
            throw new Error('Venta no encontrada');
        }

        const { total, moneda } = ventaResult.rows[0];

        // Verificar que no existe ya una factura para esta venta
        const facturaExistente = await client.query(
            'SELECT id_factura FROM facturas WHERE id_venta = $1',
            [id_venta]
        );

        if (facturaExistente.rows.length > 0) {
            throw new Error('Ya existe una factura para esta venta');
        }

        // Crear factura
        const facturaResult = await client.query(`
            INSERT INTO facturas (
                tipo, serie, numero, id_venta, 
                ruc_emisor, razon_social_emisor, direccion_emisor,
                ruc_receptor, dni_receptor, razon_social_receptor, direccion_receptor,
                total, moneda
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
            RETURNING *
        `, [
            'VENTA', serie, numero, id_venta,
            ruc_emisor, razon_social_emisor, direccion_emisor,
            ruc_receptor, dni_receptor, razon_social_receptor, direccion_receptor,
            total, moneda
        ]);

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Factura de venta creada exitosamente',
            factura: facturaResult.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Ya existe una factura con esta serie y número' });
        }
        console.error('Error al crear factura de venta:', error);
        res.status(400).json({ error: error.message });
    } finally {
        client.release();
    }
});

// POST - Crear factura de compra
router.post('/compra', authenticateToken, async (req, res) => {
    const client = await pool.connect();

    try {
        const { error } = createFacturaCompraSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const {
            id_compra,
            serie,
            numero,
            ruc_emisor,
            razon_social_emisor,
            direccion_emisor,
            ruc_receptor,
            razon_social_receptor,
            direccion_receptor
        } = req.body;

        await client.query('BEGIN');

        // Verificar que la compra existe y obtener su total y moneda
        const compraResult = await client.query(
            'SELECT total, moneda FROM compras WHERE id_compra = $1',
            [id_compra]
        );

        if (compraResult.rows.length === 0) {
            throw new Error('Compra no encontrada');
        }

        const { total, moneda } = compraResult.rows[0];

        // Verificar que no existe ya una factura para esta compra
        const facturaExistente = await client.query(
            'SELECT id_factura FROM facturas WHERE id_compra = $1',
            [id_compra]
        );

        if (facturaExistente.rows.length > 0) {
            throw new Error('Ya existe una factura para esta compra');
        }

        // Crear factura
        const facturaResult = await client.query(`
            INSERT INTO facturas (
                tipo, serie, numero, id_compra, 
                ruc_emisor, razon_social_emisor, direccion_emisor,
                ruc_receptor, razon_social_receptor, direccion_receptor,
                total, moneda
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
            RETURNING *
        `, [
            'COMPRA', serie, numero, id_compra,
            ruc_emisor, razon_social_emisor, direccion_emisor,
            ruc_receptor, razon_social_receptor, direccion_receptor,
            total, moneda
        ]);

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Factura de compra creada exitosamente',
            factura: facturaResult.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Ya existe una factura con esta serie y número' });
        }
        console.error('Error al crear factura de compra:', error);
        res.status(400).json({ error: error.message });
    } finally {
        client.release();
    }
});

// PUT - Actualizar factura (datos del emisor/receptor)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            ruc_emisor,
            razon_social_emisor,
            direccion_emisor,
            ruc_receptor,
            dni_receptor,
            razon_social_receptor,
            direccion_receptor
        } = req.body;

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (ruc_emisor) {
            updates.push(`ruc_emisor = ${paramCount}`);
            values.push(ruc_emisor);
            paramCount++;
        }

        if (razon_social_emisor) {
            updates.push(`razon_social_emisor = ${paramCount}`);
            values.push(razon_social_emisor);
            paramCount++;
        }

        if (direccion_emisor !== undefined) {
            updates.push(`direccion_emisor = ${paramCount}`);
            values.push(direccion_emisor);
            paramCount++;
        }

        if (ruc_receptor !== undefined) {
            updates.push(`ruc_receptor = ${paramCount}`);
            values.push(ruc_receptor);
            paramCount++;
        }

        if (dni_receptor !== undefined) {
            updates.push(`dni_receptor = ${paramCount}`);
            values.push(dni_receptor);
            paramCount++;
        }

        if (razon_social_receptor !== undefined) {
            updates.push(`razon_social_receptor = ${paramCount}`);
            values.push(razon_social_receptor);
            paramCount++;
        }

        if (direccion_receptor !== undefined) {
            updates.push(`direccion_receptor = ${paramCount}`);
            values.push(direccion_receptor);
            paramCount++;
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No hay datos para actualizar' });
        }

        values.push(id);

        const result = await pool.query(
            `UPDATE facturas SET ${updates.join(', ')} 
             WHERE id_factura = ${paramCount} 
             RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }

        res.json({
            message: 'Factura actualizada exitosamente',
            factura: result.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar factura:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// DELETE - Eliminar factura
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM facturas WHERE id_factura = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }

        res.json({
            message: 'Factura eliminada exitosamente',
            factura: result.rows[0]
        });
    } catch (error) {
        console.error('Error al eliminar factura:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// GET - Reportes de facturación
router.get('/reportes/resumen', authenticateToken, async (req, res) => {
    try {
        const { fecha_desde = '', fecha_hasta = '', tipo = '' } = req.query;

        let query = `
            SELECT 
                tipo,
                COUNT(*) as total_facturas,
                SUM(total) as monto_total,
                AVG(total) as promedio_factura
            FROM facturas
        `;

        const params = [];
        const conditions = [];

        if (fecha_desde) {
            conditions.push(`fecha >= $${params.length + 1}`);
            params.push(fecha_desde);
        }

        if (fecha_hasta) {
            conditions.push(`fecha <= $${params.length + 1}`);
            params.push(fecha_hasta + ' 23:59:59');
        }

        if (tipo) {
            conditions.push(`tipo = $${params.length + 1}`);
            params.push(tipo.toUpperCase());
        }

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }

        query += ` GROUP BY tipo ORDER BY tipo`;

        const result = await pool.query(query, params);

        res.json(result.rows);
    } catch (error) {
        console.error('Error al generar reporte de facturas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// GET - Facturas sin generar (ventas y compras sin facturar)
router.get('/reportes/pendientes', authenticateToken, async (req, res) => {
    try {
        const ventasSinFacturar = await pool.query(`
            SELECT 
                v.id_venta,
                v.fecha,
                v.total,
                v.moneda,
                CONCAT(c.nombre, ' ', c.apellido_paterno, ' ', c.apellido_materno) as cliente,
                c.dni
            FROM ventas v
            LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
            LEFT JOIN facturas f ON v.id_venta = f.id_venta
            WHERE f.id_factura IS NULL
            ORDER BY v.fecha DESC
        `);

        const comprasSinFacturar = await pool.query(`
            SELECT 
                comp.id_compra,
                comp.fecha,
                comp.total,
                comp.moneda,
                p.razon_social as proveedor,
                p.ruc
            FROM compras comp
            LEFT JOIN proveedores p ON comp.id_proveedor = p.id_proveedor
            LEFT JOIN facturas f ON comp.id_compra = f.id_compra
            WHERE f.id_factura IS NULL
            ORDER BY comp.fecha DESC
        `);

        res.json({
            ventas_sin_facturar: ventasSinFacturar.rows,
            compras_sin_facturar: comprasSinFacturar.rows
        });
    } catch (error) {
        console.error('Error al obtener facturas pendientes:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;