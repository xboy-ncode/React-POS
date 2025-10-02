// =============================
// routes/marcas.js
// =============================
const express = require('express');
const Joi = require('joi');
const { pool } = require('../config/database'); 

const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validaciones
const marcaSchema = Joi.object({
    nombre: Joi.string().max(100).required()
});

// GET - Obtener todas las marcas
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT m.*, COUNT(p.id_producto) as total_productos
      FROM marcas m
      LEFT JOIN productos p ON m.id_marca = p.id_marca
      GROUP BY m.id_marca, m.nombre
      ORDER BY m.nombre
    `);

        res.json({ marcas: result.rows });
    } catch (error) {
        console.error('Error al obtener marcas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST - Crear marca
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { error } = marcaSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { nombre } = req.body;

        const result = await pool.query(
            'INSERT INTO marcas (nombre) VALUES ($1) RETURNING *',
            [nombre]
        );

        res.status(201).json({
            message: 'Marca creada exitosamente',
            marca: result.rows[0]
        });
    } catch (error) {
        console.error('Error al crear marca:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// PUT - Actualizar marca
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = marcaSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { nombre } = req.body;

        const result = await pool.query(
            'UPDATE marcas SET nombre = $1 WHERE id_marca = $2 RETURNING *',
            [nombre, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Marca no encontrada' });
        }

        res.json({
            message: 'Marca actualizada exitosamente',
            marca: result.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar marca:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// DELETE - Eliminar marca
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM marcas WHERE id_marca = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Marca no encontrada' });
        }

        res.json({
            message: 'Marca eliminada exitosamente',
            marca_eliminada: result.rows[0]
        });
    } catch (error) {
        console.error('Error al eliminar marca:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;