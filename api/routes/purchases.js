// routes/buys.js
const express = require('express');
const Joi = require('joi');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validaciones
const createCompraSchema = Joi.object({
    id_proveedor: Joi.number().integer().required(),
    metodo_pago: Joi.string().max(50).required(),
    moneda: Joi.string().length(3).default('PEN'),
    productos: Joi.array().items(
        Joi.object({
            id_producto: Joi.number().integer().required(),
            cantidad: Joi.number().integer().positive().required(),
            precio_unitario: Joi.number().positive().required()
        })
    ).min(1).required()
});

// GET - Obtener todas las compras
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, fecha_desde = '', fecha_hasta = '', proveedor = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT c.*, 
                   p.razon_social as proveedor_nombre,
                   p.ruc as proveedor_ruc
            FROM compras c
            LEFT JOIN proveedores p ON c.id_proveedor = p.id_proveedor
        `;

        let countQuery = `
            SELECT COUNT(*) FROM compras c
            LEFT JOIN proveedores p ON c.id_proveedor = p.id_proveedor
        `;

        const conditions = [];
        const queryParams = [];
        let paramCount = 1;

        if (fecha_desde) {
            conditions.push(`c.fecha >= $${paramCount}`);
            queryParams.push(fecha_desde);
            paramCount++;
        }

        if (fecha_hasta) {
            conditions.push(`c.fecha <= $${paramCount}`);
            queryParams.push(fecha_hasta + ' 23:59:59');
            paramCount++;
        }

        if (proveedor) {
            conditions.push(`(p.ruc ILIKE $${paramCount} OR p.razon_social ILIKE $${paramCount})`);
            queryParams.push(`%${proveedor}%`);
            paramCount++;
        }

        if (conditions.length > 0) {
            const whereClause = ` WHERE ${conditions.join(' AND ')}`;
            query += whereClause;
            countQuery += whereClause;
        }

        query += ` ORDER BY c.fecha DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        queryParams.push(limit, offset);

        const [result, countResult] = await Promise.all([
            pool.query(query, queryParams),
            pool.query(countQuery, queryParams.slice(0, -2))
        ]);

        const total = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(total / limit);

        res.json({
            compras: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Error al obtener compras:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// GET - Obtener compra por ID con detalles
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const compraResult = await pool.query(`
            SELECT c.*, 
                   p.ruc, p.razon_social, p.direccion, 
                   p.telefono, p.correo
            FROM compras c
            LEFT JOIN proveedores p ON c.id_proveedor = p.id_proveedor
            WHERE c.id_compra = $1
        `, [id]);

        if (compraResult.rows.length === 0) {
            return res.status(404).json({ error: 'Compra no encontrada' });
        }

        const detalleResult = await pool.query(`
            SELECT dc.*, p.nombre as producto_nombre
            FROM detalle_compras dc
            LEFT JOIN productos p ON dc.id_producto = p.id_producto
            WHERE dc.id_compra = $1
            ORDER BY dc.id_detalle
        `, [id]);

        const compra = compraResult.rows[0];
        compra.detalles = detalleResult.rows;

        res.json(compra);
    } catch (error) {
        console.error('Error al obtener compra:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST - Crear nueva compra
router.post('/', authenticateToken, async (req, res) => {
    const client = await pool.connect();

    try {
        const { error } = createCompraSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { id_proveedor, metodo_pago, moneda, productos } = req.body;

        await client.query('BEGIN');

        // Verificar que el proveedor existe
        const proveedorResult = await client.query(
            'SELECT id_proveedor FROM proveedores WHERE id_proveedor = $1',
            [id_proveedor]
        );

        if (proveedorResult.rows.length === 0) {
            throw new Error('Proveedor no encontrado');
        }

        // Verificar que todos los productos existen
        for (const item of productos) {
            const productoResult = await client.query(
                'SELECT id_producto FROM productos WHERE id_producto = $1',
                [item.id_producto]
            );

            if (productoResult.rows.length === 0) {
                throw new Error(`Producto con ID ${item.id_producto} no encontrado`);
            }
        }

        // Calcular total
        let total = 0;
        productos.forEach(item => {
            total += item.cantidad * item.precio_unitario;
        });

        // Insertar compra
        const compraResult = await client.query(
            'INSERT INTO compras (id_proveedor, total, moneda, metodo_pago) VALUES ($1, $2, $3, $4) RETURNING *',
            [id_proveedor, total, moneda || 'PEN', metodo_pago]
        );

        const compraId = compraResult.rows[0].id_compra;

        // Insertar detalles y actualizar stock
        for (const item of productos) {
            // Insertar detalle
            const subtotal = item.cantidad * item.precio_unitario;
            await client.query(
                'INSERT INTO detalle_compras (id_compra, id_producto, cantidad, precio_unitario, subtotal) VALUES ($1, $2, $3, $4, $5)',
                [compraId, item.id_producto, item.cantidad, item.precio_unitario, subtotal]
            );

            // Actualizar stock (aumentar)
            await client.query(
                'UPDATE productos SET stock = stock + $1 WHERE id_producto = $2',
                [item.cantidad, item.id_producto]
            );
        }

        await client.query('COMMIT');

        // Obtener compra completa con detalles
        const compraCompleta = await pool.query(`
            SELECT c.*, 
                   p.ruc, p.razon_social, p.direccion, 
                   p.telefono, p.correo
            FROM compras c
            LEFT JOIN proveedores p ON c.id_proveedor = p.id_proveedor
            WHERE c.id_compra = $1
        `, [compraId]);

        const detalles = await pool.query(`
            SELECT dc.*, p.nombre as producto_nombre
            FROM detalle_compras dc
            LEFT JOIN productos p ON dc.id_producto = p.id_producto
            WHERE dc.id_compra = $1
        `, [compraId]);

        const resultado = compraCompleta.rows[0];
        resultado.detalles = detalles.rows;

        res.status(201).json({
            message: 'Compra creada exitosamente',
            compra: resultado
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al crear compra:', error);
        res.status(400).json({ error: error.message });
    } finally {
        client.release();
    }
});

// PUT - Actualizar compra (solo método de pago y proveedor)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { id_proveedor, metodo_pago } = req.body;

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (id_proveedor !== undefined) {
            // Verificar que el proveedor existe
            const proveedorResult = await pool.query(
                'SELECT id_proveedor FROM proveedores WHERE id_proveedor = $1',
                [id_proveedor]
            );

            if (proveedorResult.rows.length === 0) {
                return res.status(400).json({ error: 'Proveedor no encontrado' });
            }

            updates.push(`id_proveedor = $${paramCount}`);
            values.push(id_proveedor);
            paramCount++;
        }

        if (metodo_pago) {
            updates.push(`metodo_pago = $${paramCount}`);
            values.push(metodo_pago);
            paramCount++;
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No hay datos para actualizar' });
        }

        values.push(id);

        const result = await pool.query(
            `UPDATE compras SET ${updates.join(', ')} 
             WHERE id_compra = $${paramCount} 
             RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Compra no encontrada' });
        }

        res.json({
            message: 'Compra actualizada exitosamente',
            compra: result.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar compra:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// DELETE - Anular compra (reduce stock)
router.delete('/:id', authenticateToken, async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;

        await client.query('BEGIN');

        // Obtener detalles de la compra para reducir stock
        const detallesResult = await client.query(
            'SELECT id_producto, cantidad FROM detalle_compras WHERE id_compra = $1',
            [id]
        );

        if (detallesResult.rows.length === 0) {
            return res.status(404).json({ error: 'Compra no encontrada' });
        }

        // Verificar que hay suficiente stock para restar
        for (const detalle of detallesResult.rows) {
            const stockResult = await client.query(
                'SELECT stock FROM productos WHERE id_producto = $1',
                [detalle.id_producto]
            );

            if (stockResult.rows.length > 0 && stockResult.rows[0].stock < detalle.cantidad) {
                throw new Error(`Stock insuficiente para restar del producto ID ${detalle.id_producto}. Stock actual: ${stockResult.rows[0].stock}, cantidad a restar: ${detalle.cantidad}`);
            }
        }

        // Reducir stock de productos
        for (const detalle of detallesResult.rows) {
            await client.query(
                'UPDATE productos SET stock = stock - $1 WHERE id_producto = $2',
                [detalle.cantidad, detalle.id_producto]
            );
        }

        // Eliminar compra (los detalles se eliminan por CASCADE)
        const result = await client.query(
            'DELETE FROM compras WHERE id_compra = $1 RETURNING *',
            [id]
        );

        await client.query('COMMIT');

        res.json({
            message: 'Compra anulada exitosamente. Stock reducido.',
            compra_anulada: result.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al anular compra:', error);
        res.status(400).json({ error: error.message });
    } finally {
        client.release();
    }
});

// GET - Reportes de compras
router.get('/reportes/resumen', authenticateToken, async (req, res) => {
    try {
        const { fecha_desde = '', fecha_hasta = '' } = req.query;

        let query = `
            SELECT 
                COUNT(*) as total_compras,
                SUM(total) as monto_total,
                AVG(total) as promedio_compra,
                COUNT(DISTINCT id_proveedor) as proveedores_activos
            FROM compras
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

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }

        const result = await pool.query(query, params);

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al generar reporte de compras:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// GET - Compras por proveedor (resumen)
router.get('/reportes/por-proveedor', authenticateToken, async (req, res) => {
    try {
        const { fecha_desde = '', fecha_hasta = '' } = req.query;

        let query = `
            SELECT 
                p.id_proveedor,
                p.razon_social,
                p.ruc,
                COUNT(c.id_compra) as total_compras,
                COALESCE(SUM(c.total), 0) as monto_total
            FROM proveedores p
            LEFT JOIN compras c ON p.id_proveedor = c.id_proveedor
        `;

        const params = [];
        const conditions = [];

        if (fecha_desde) {
            conditions.push(`c.fecha >= $${params.length + 1}`);
            params.push(fecha_desde);
        }

        if (fecha_hasta) {
            conditions.push(`c.fecha <= $${params.length + 1}`);
            params.push(fecha_hasta + ' 23:59:59');
        }

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }

        query += ` GROUP BY p.id_proveedor, p.razon_social, p.ruc
                   HAVING COUNT(c.id_compra) > 0
                   ORDER BY monto_total DESC`;

        const result = await pool.query(query, params);

        res.json(result.rows);
    } catch (error) {
        console.error('Error al generar reporte por proveedor:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;