// routes/ventas.js
const express = require('express');
const Joi = require('joi');
const { pool } = require('../config/database'); 

const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validaciones
const createVentaSchema = Joi.object({
    id_cliente: Joi.number().integer().allow(null),
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

// GET - Obtener todas las ventas
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, fecha_desde = '', fecha_hasta = '', cliente = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = `
      SELECT v.*, 
             CONCAT(c.nombre, ' ', c.apellido_paterno, ' ', c.apellido_materno) as cliente_nombre,
             c.dni as cliente_dni,
             u.nombre_usuario as vendedor
      FROM ventas v
      LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
      LEFT JOIN usuarios u ON v.id_usuario = u.id_usuario
    `;

        let countQuery = `
      SELECT COUNT(*) FROM ventas v
      LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
    `;

        const conditions = [];
        const queryParams = [];
        let paramCount = 1;

        if (fecha_desde) {
            conditions.push(`v.fecha >= $${paramCount}`);
            queryParams.push(fecha_desde);
            paramCount++;
        }

        if (fecha_hasta) {
            conditions.push(`v.fecha <= $${paramCount}`);
            queryParams.push(fecha_hasta + ' 23:59:59');
            paramCount++;
        }

        if (cliente) {
            conditions.push(`(c.dni ILIKE $${paramCount} OR c.nombre ILIKE $${paramCount} OR c.apellido_paterno ILIKE $${paramCount})`);
            queryParams.push(`%${cliente}%`);
            paramCount++;
        }

        if (conditions.length > 0) {
            const whereClause = ` WHERE ${conditions.join(' AND ')}`;
            query += whereClause;
            countQuery += whereClause;
        }

        query += ` ORDER BY v.fecha DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        queryParams.push(limit, offset);

        const [result, countResult] = await Promise.all([
            pool.query(query, queryParams),
            pool.query(countQuery, queryParams.slice(0, -2))
        ]);

        const total = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(total / limit);

        res.json({
            ventas: result.rows,
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
        console.error('Error al obtener ventas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// GET - Obtener venta por ID con detalles
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const ventaResult = await pool.query(`
      SELECT v.*, 
             c.dni, c.nombre, c.apellido_paterno, c.apellido_materno,
             c.direccion, c.telefono, c.correo,
             u.nombre_usuario as vendedor
      FROM ventas v
      LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
      LEFT JOIN usuarios u ON v.id_usuario = u.id_usuario
      WHERE v.id_venta = $1
    `, [id]);

        if (ventaResult.rows.length === 0) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        const detalleResult = await pool.query(`
      SELECT dv.*, p.nombre as producto_nombre
      FROM detalle_ventas dv
      LEFT JOIN productos p ON dv.id_producto = p.id_producto
      WHERE dv.id_venta = $1
      ORDER BY dv.id_detalle
    `, [id]);

        const venta = ventaResult.rows[0];
        venta.detalles = detalleResult.rows;

        res.json(venta);
    } catch (error) {
        console.error('Error al obtener venta:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST - Crear nueva venta
router.post('/', authenticateToken, async (req, res) => {
    const client = await pool.connect();

    try {
        const { error } = createVentaSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { id_cliente, metodo_pago, moneda, productos } = req.body;

        await client.query('BEGIN');

        // Verificar stock disponible para todos los productos
        for (const item of productos) {
            const stockResult = await client.query(
                'SELECT stock FROM productos WHERE id_producto = $1',
                [item.id_producto]
            );

            if (stockResult.rows.length === 0) {
                throw new Error(`Producto con ID ${item.id_producto} no encontrado`);
            }

            if (stockResult.rows[0].stock < item.cantidad) {
                throw new Error(`Stock insuficiente para el producto ID ${item.id_producto}. Stock disponible: ${stockResult.rows[0].stock}`);
            }
        }

        // Calcular total
        let total = 0;
        productos.forEach(item => {
            total += item.cantidad * item.precio_unitario;
        });

        // Insertar venta
        const ventaResult = await client.query(
            'INSERT INTO ventas (id_cliente, id_usuario, total, moneda, metodo_pago) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [id_cliente, req.user.id_usuario, total, moneda || 'PEN', metodo_pago]
        );

        const ventaId = ventaResult.rows[0].id_venta;

        // Insertar detalles y actualizar stock
        for (const item of productos) {
            // Insertar detalle
            const subtotal = item.cantidad * item.precio_unitario;
            await client.query(
                'INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario, subtotal) VALUES ($1, $2, $3, $4, $5)',
                [ventaId, item.id_producto, item.cantidad, item.precio_unitario, subtotal]
            );

            // Actualizar stock
            await client.query(
                'UPDATE productos SET stock = stock - $1 WHERE id_producto = $2',
                [item.cantidad, item.id_producto]
            );
        }

        await client.query('COMMIT');

        // Obtener venta completa con detalles
        const ventaCompleta = await pool.query(`
      SELECT v.*, 
             c.dni, c.nombre, c.apellido_paterno, c.apellido_materno,
             u.nombre_usuario as vendedor
      FROM ventas v
      LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
      LEFT JOIN usuarios u ON v.id_usuario = u.id_usuario
      WHERE v.id_venta = $1
    `, [ventaId]);

        const detalles = await pool.query(`
      SELECT dv.*, p.nombre as producto_nombre
      FROM detalle_ventas dv
      LEFT JOIN productos p ON dv.id_producto = p.id_producto
      WHERE dv.id_venta = $1
    `, [ventaId]);

        const resultado = ventaCompleta.rows[0];
        resultado.detalles = detalles.rows;

        res.status(201).json({
            message: 'Venta creada exitosamente',
            venta: resultado
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al crear venta:', error);
        res.status(400).json({ error: error.message });
    } finally {
        client.release();
    }
});

// PUT - Actualizar venta (solo método de pago y cliente)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { id_cliente, metodo_pago } = req.body;

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (id_cliente !== undefined) {
            updates.push(`id_cliente = $${paramCount}`);
            values.push(id_cliente);
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
            `UPDATE ventas SET ${updates.join(', ')} 
       WHERE id_venta = $${paramCount} 
       RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        res.json({
            message: 'Venta actualizada exitosamente',
            venta: result.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar venta:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// DELETE - Anular venta (restaura stock)
router.delete('/:id', authenticateToken, async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;

        await client.query('BEGIN');

        // Obtener detalles de la venta para restaurar stock
        const detallesResult = await client.query(
            'SELECT id_producto, cantidad FROM detalle_ventas WHERE id_venta = $1',
            [id]
        );

        if (detallesResult.rows.length === 0) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        // Restaurar stock de productos
        for (const detalle of detallesResult.rows) {
            await client.query(
                'UPDATE productos SET stock = stock + $1 WHERE id_producto = $2',
                [detalle.cantidad, detalle.id_producto]
            );
        }

        // Eliminar venta (los detalles se eliminan por CASCADE)
        const result = await client.query(
            'DELETE FROM ventas WHERE id_venta = $1 RETURNING *',
            [id]
        );

        await client.query('COMMIT');

        res.json({
            message: 'Venta anulada exitosamente. Stock restaurado.',
            venta_anulada: result.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al anular venta:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        client.release();
    }
});

// GET - Reportes de ventas
router.get('/reportes/resumen', authenticateToken, async (req, res) => {
    try {
        const { fecha_desde = '', fecha_hasta = '' } = req.query;

        let query = `
      SELECT 
        COUNT(*) as total_ventas,
        SUM(total) as monto_total,
        AVG(total) as promedio_venta,
        COUNT(DISTINCT id_cliente) as clientes_atendidos
      FROM ventas
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
        console.error('Error al generar reporte de ventas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;