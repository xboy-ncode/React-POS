// routes/productos.js
// =============================
const express = require('express');
const Joi = require('joi');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validaciones
const createProductSchema = Joi.object({
    nombre: Joi.string().max(150).required(),
    descripcion: Joi.string(),
    id_categoria: Joi.number().integer(),
    id_marca: Joi.number().integer(),
    stock: Joi.number().integer().min(0).default(0),
    precio_unitario: Joi.number().positive().required(),
    moneda: Joi.string().length(3).default('PEN'),
    activo: Joi.boolean().default(true)
});

const updateProductSchema = Joi.object({
    nombre: Joi.string().max(150),
    descripcion: Joi.string(),
    id_categoria: Joi.number().integer().allow(null),
    id_marca: Joi.number().integer().allow(null),
    stock: Joi.number().integer().min(0),
    precio_unitario: Joi.number().positive(),
    moneda: Joi.string().length(3),
    activo: Joi.boolean()
});

// GET - Obtener todos los productos
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', categoria = '', marca = '', activo = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = `
      SELECT p.*, c.nombre as categoria_nombre, m.nombre as marca_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
      LEFT JOIN marcas m ON p.id_marca = m.id_marca
    `;

        let countQuery = `
      SELECT COUNT(*) FROM productos p
      LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
      LEFT JOIN marcas m ON p.id_marca = m.id_marca
    `;

        const conditions = [];
        const queryParams = [];
        let paramCount = 1;

        if (search) {
            conditions.push(`(p.nombre ILIKE ${paramCount} OR p.descripcion ILIKE ${paramCount})`);
            queryParams.push(`%${search}%`);
            paramCount++;
        }

        if (categoria) {
            conditions.push(`p.id_categoria = ${paramCount}`);
            queryParams.push(categoria);
            paramCount++;
        }

        if (marca) {
            conditions.push(`p.id_marca = ${paramCount}`);
            queryParams.push(marca);
            paramCount++;
        }

        if (activo !== '') {
            conditions.push(`p.activo = ${paramCount}`);
            queryParams.push(activo === 'true');
            paramCount++;
        }

        if (conditions.length > 0) {
            const whereClause = ` WHERE ${conditions.join(' AND ')}`;
            query += whereClause;
            countQuery += whereClause;
        }

        query += ` ORDER BY p.nombre LIMIT ${paramCount} OFFSET ${paramCount + 1}`;
        queryParams.push(limit, offset);

        const [result, countResult] = await Promise.all([
            pool.query(query, queryParams),
            pool.query(countQuery, queryParams.slice(0, -2))
        ]);

        const total = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(total / limit);

        res.json({
            productos: result.rows,
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
        console.error('Error al obtener productos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// GET - Obtener producto por ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
      SELECT p.*, c.nombre as categoria_nombre, m.nombre as marca_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
      LEFT JOIN marcas m ON p.id_marca = m.id_marca
      WHERE p.id_producto = $1
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST - Crear producto
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { error } = createProductSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const {
            nombre, descripcion, id_categoria, id_marca,
            stock, precio_unitario, moneda, activo
        } = req.body;

        const result = await pool.query(
            `INSERT INTO productos (nombre, descripcion, id_categoria, id_marca, 
                            stock, precio_unitario, moneda, activo) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
            [nombre, descripcion, id_categoria, id_marca,
                stock || 0, precio_unitario, moneda || 'PEN', activo !== false]
        );

        res.status(201).json({
            message: 'Producto creado exitosamente',
            producto: result.rows[0]
        });
    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// PUT - Actualizar producto
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = updateProductSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const {
            nombre, descripcion, id_categoria, id_marca,
            stock, precio_unitario, moneda, activo
        } = req.body;

        const updates = [];
        const values = [];
        let paramCount = 1;

        const fields = {
            nombre, descripcion, id_categoria, id_marca,
            stock, precio_unitario, moneda, activo
        };

        Object.entries(fields).forEach(([key, value]) => {
            if (value !== undefined) {
                updates.push(`${key} = ${paramCount}`);
                values.push(value);
                paramCount++;
            }
        });

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No hay datos para actualizar' });
        }

        values.push(id);

        const result = await pool.query(
            `UPDATE productos SET ${updates.join(', ')} 
       WHERE id_producto = ${paramCount} 
       RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({
            message: 'Producto actualizado exitosamente',
            producto: result.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// DELETE - Eliminar producto
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si el producto tiene ventas o compras asociadas
        const [ventasResult, comprasResult] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM detalle_ventas WHERE id_producto = $1', [id]),
            pool.query('SELECT COUNT(*) FROM detalle_compras WHERE id_producto = $1', [id])
        ]);

        const totalVentas = parseInt(ventasResult.rows[0].count);
        const totalCompras = parseInt(comprasResult.rows[0].count);

        if (totalVentas > 0 || totalCompras > 0) {
            return res.status(400).json({
                error: 'No se puede eliminar el producto porque tiene transacciones asociadas'
            });
        }

        const result = await pool.query(
            'DELETE FROM productos WHERE id_producto = $1 RETURNING nombre',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({
            message: 'Producto eliminado exitosamente',
            producto_eliminado: result.rows[0]
        });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;