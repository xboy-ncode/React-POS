// routes/categorias.js
const express = require('express');
const Joi = require('joi');
const { pool } = require('../config/database'); 

const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validaciones
const categorySchema = Joi.object({
    nombre: Joi.string().max(100).required(),
    descripcion: Joi.string()
});

// GET - Obtener todas las categorías
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT c.*, COUNT(p.id_producto) as total_productos
      FROM categorias c
      LEFT JOIN productos p ON c.id_categoria = p.id_categoria
      GROUP BY c.id_categoria, c.nombre, c.descripcion
      ORDER BY c.nombre
    `);

        res.json({ categorias: result.rows });
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST - Crear categoría
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { error } = categorySchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { nombre, descripcion } = req.body;

        const result = await pool.query(
            'INSERT INTO categorias (nombre, descripcion) VALUES ($1, $2) RETURNING *',
            [nombre, descripcion]
        );

        res.status(201).json({
            message: 'Categoría creada exitosamente',
            categoria: result.rows[0]
        });
    } catch (error) {
        console.error('Error al crear categoría:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// PUT - Actualizar categoría
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = categorySchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { nombre, descripcion } = req.body;

        const result = await pool.query(
            'UPDATE categorias SET nombre = $1, descripcion = $2 WHERE id_categoria = $3 RETURNING *',
            [nombre, descripcion, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        res.json({
            message: 'Categoría actualizada exitosamente',
            categoria: result.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar categoría:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// DELETE - Eliminar categoría
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM categorias WHERE id_categoria = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        res.json({
            message: 'Categoría eliminada exitosamente',
            categoria_eliminada: result.rows[0]
        });
    } catch (error) {
        console.error('Error al eliminar categoría:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;