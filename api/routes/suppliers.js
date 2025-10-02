// routes/suppliers.js
const express = require('express');
const Joi = require('joi');
const { pool } = require('../config/database'); 

const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validaciones
const createSupplierSchema = Joi.object({
    ruc: Joi.string().length(11).pattern(/^\d+$/).required(),
    razon_social: Joi.string().max(200).required(),
    direccion: Joi.string().allow(null, ''),
    telefono: Joi.string().max(15).allow(null, ''),
    correo: Joi.string().email().max(100).allow(null, '')
});

const updateSupplierSchema = Joi.object({
    razon_social: Joi.string().max(200),
    direccion: Joi.string().allow(null, ''),
    telefono: Joi.string().max(15).allow(null, ''),
    correo: Joi.string().email().max(100).allow(null, '')
});

// GET - Obtener todos los proveedores
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT p.*,
                   COUNT(c.id_compra) as total_compras,
                   COALESCE(SUM(c.total), 0) as monto_total_compras
            FROM proveedores p
            LEFT JOIN compras c ON p.id_proveedor = c.id_proveedor
        `;

        let countQuery = `SELECT COUNT(*) FROM proveedores p`;

        const conditions = [];
        const queryParams = [];
        let paramCount = 1;

        if (search) {
            conditions.push(`(p.ruc ILIKE $${paramCount} OR p.razon_social ILIKE $${paramCount})`);
            queryParams.push(`%${search}%`);
            paramCount++;
        }

        if (conditions.length > 0) {
            const whereClause = ` WHERE ${conditions.join(' AND ')}`;
            query += whereClause;
            countQuery += whereClause;
        }

        query += ` GROUP BY p.id_proveedor 
                   ORDER BY p.razon_social 
                   LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        queryParams.push(limit, offset);

        const [result, countResult] = await Promise.all([
            pool.query(query, queryParams),
            pool.query(countQuery, queryParams.slice(0, -2))
        ]);

        const total = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(total / limit);

        res.json({
            proveedores: result.rows,
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
        console.error('Error al obtener proveedores:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// GET - Obtener proveedor por ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT p.*,
                   COUNT(c.id_compra) as total_compras,
                   COALESCE(SUM(c.total), 0) as monto_total_compras,
                   MAX(c.fecha) as ultima_compra
            FROM proveedores p
            LEFT JOIN compras c ON p.id_proveedor = c.id_proveedor
            WHERE p.id_proveedor = $1
            GROUP BY p.id_proveedor
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener proveedor:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST - Crear nuevo proveedor
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { error } = createSupplierSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { ruc, razon_social, direccion, telefono, correo } = req.body;

        const result = await pool.query(
            'INSERT INTO proveedores (ruc, razon_social, direccion, telefono, correo) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [ruc, razon_social, direccion, telefono, correo]
        );

        res.status(201).json({
            message: 'Proveedor creado exitosamente',
            proveedor: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Ya existe un proveedor con este RUC' });
        }
        console.error('Error al crear proveedor:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// PUT - Actualizar proveedor
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = updateSupplierSchema.validate(req.body);

        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { razon_social, direccion, telefono, correo } = req.body;

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (razon_social) {
            updates.push(`razon_social = $${paramCount}`);
            values.push(razon_social);
            paramCount++;
        }

        if (direccion !== undefined) {
            updates.push(`direccion = $${paramCount}`);
            values.push(direccion);
            paramCount++;
        }

        if (telefono !== undefined) {
            updates.push(`telefono = $${paramCount}`);
            values.push(telefono);
            paramCount++;
        }

        if (correo !== undefined) {
            updates.push(`correo = $${paramCount}`);
            values.push(correo);
            paramCount++;
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No hay datos para actualizar' });
        }

        values.push(id);

        const result = await pool.query(
            `UPDATE proveedores SET ${updates.join(', ')} 
             WHERE id_proveedor = $${paramCount} 
             RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }

        res.json({
            message: 'Proveedor actualizado exitosamente',
            proveedor: result.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar proveedor:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// DELETE - Eliminar proveedor
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si tiene compras asociadas
        const comprasResult = await pool.query(
            'SELECT COUNT(*) FROM compras WHERE id_proveedor = $1',
            [id]
        );

        if (parseInt(comprasResult.rows[0].count) > 0) {
            return res.status(400).json({
                error: 'No se puede eliminar el proveedor porque tiene compras asociadas'
            });
        }

        const result = await pool.query(
            'DELETE FROM proveedores WHERE id_proveedor = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }

        res.json({
            message: 'Proveedor eliminado exitosamente',
            proveedor: result.rows[0]
        });
    } catch (error) {
        console.error('Error al eliminar proveedor:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// GET - Compras por proveedor
router.get('/:id/compras', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const result = await pool.query(`
            SELECT c.*,
                   p.razon_social
            FROM compras c
            JOIN proveedores p ON c.id_proveedor = p.id_proveedor
            WHERE c.id_proveedor = $1
            ORDER BY c.fecha DESC
            LIMIT $2 OFFSET $3
        `, [id, limit, offset]);

        const countResult = await pool.query(
            'SELECT COUNT(*) FROM compras WHERE id_proveedor = $1',
            [id]
        );

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
        console.error('Error al obtener compras del proveedor:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;