// routes/users.js
const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { pool } = require('../config/database'); 

const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Validaciones
const createUserSchema = Joi.object({
  nombre_usuario: Joi.string().min(3).max(50).required(),
  clave: Joi.string().min(6).required(),
  rol: Joi.string().valid('ADMIN', 'CAJERO').required()
});

const updateUserSchema = Joi.object({
  nombre_usuario: Joi.string().min(3).max(50),
  clave: Joi.string().min(6),
  rol: Joi.string().valid('ADMIN', 'CAJERO')
});

// GET - Obtener todos los usuarios (solo ADMIN)
router.get('/', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id_usuario, nombre_usuario, rol, fecha_creacion 
      FROM usuarios 
      ORDER BY fecha_creacion DESC
    `);
    
    res.json({
      usuarios: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET - Obtener usuario por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Solo ADMIN puede ver otros usuarios, CAJERO solo puede ver su propio perfil
    if (req.user.rol !== 'ADMIN' && req.user.id_usuario !== parseInt(id)) {
      return res.status(403).json({ error: 'No tienes permisos para ver este usuario' });
    }
    
    const result = await pool.query(
      'SELECT id_usuario, nombre_usuario, rol, fecha_creacion FROM usuarios WHERE id_usuario = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST - Crear nuevo usuario (solo ADMIN)
router.post('/', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { error } = createUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { nombre_usuario, clave, rol } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await pool.query(
      'SELECT id_usuario FROM usuarios WHERE nombre_usuario = $1',
      [nombre_usuario]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'El nombre de usuario ya existe' });
    }

    // Hashear la contraseña
    const saltRounds = 10;
    const clave_hash = await bcrypt.hash(clave, saltRounds);

    // Insertar usuario
    const result = await pool.query(
      `INSERT INTO usuarios (nombre_usuario, clave_hash, rol) 
       VALUES ($1, $2, $3) 
       RETURNING id_usuario, nombre_usuario, rol, fecha_creacion`,
      [nombre_usuario, clave_hash, rol]
    );

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      usuario: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT - Actualizar usuario
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Solo ADMIN puede actualizar otros usuarios, CAJERO solo puede actualizar su propio perfil
    if (req.user.rol !== 'ADMIN' && req.user.id_usuario !== parseInt(id)) {
      return res.status(403).json({ error: 'No tienes permisos para actualizar este usuario' });
    }

    const { error } = updateUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { nombre_usuario, clave, rol } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (nombre_usuario) {
      // Verificar si el nuevo nombre de usuario ya existe
      const existingUser = await pool.query(
        'SELECT id_usuario FROM usuarios WHERE nombre_usuario = $1 AND id_usuario != $2',
        [nombre_usuario, id]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'El nombre de usuario ya existe' });
      }

      updates.push(`nombre_usuario = $${paramCount}`);
      values.push(nombre_usuario);
      paramCount++;
    }

    if (clave) {
      const saltRounds = 10;
      const clave_hash = await bcrypt.hash(clave, saltRounds);
      updates.push(`clave_hash = $${paramCount}`);
      values.push(clave_hash);
      paramCount++;
    }

    if (rol && req.user.rol === 'ADMIN') { // Solo ADMIN puede cambiar roles
      updates.push(`rol = $${paramCount}`);
      values.push(rol);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay datos para actualizar' });
    }

    values.push(id);
    
    const result = await pool.query(
      `UPDATE usuarios SET ${updates.join(', ')} 
       WHERE id_usuario = $${paramCount} 
       RETURNING id_usuario, nombre_usuario, rol, fecha_creacion`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      message: 'Usuario actualizado exitosamente',
      usuario: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE - Eliminar usuario (solo ADMIN)
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // No permitir que el admin se elimine a sí mismo
    if (req.user.id_usuario === parseInt(id)) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
    }

    const result = await pool.query(
      'DELETE FROM usuarios WHERE id_usuario = $1 RETURNING id_usuario, nombre_usuario',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      message: 'Usuario eliminado exitosamente',
      usuario_eliminado: result.rows[0]
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;