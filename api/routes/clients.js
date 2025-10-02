// routes/clientes.js
const express = require('express');
const Joi = require('joi');
const { pool, reniecDb } = require('../config/database.js');
const { authenticateToken } = require('../middleware/auth.js');
const { buscarClientePorDNI } = require('../utils/reniec.js');

const router = express.Router();

// Validaciones
const createClientSchema = Joi.object({
    dni: Joi.string().length(8).pattern(/^[0-9]+$/).required(),
    nombre: Joi.string().max(100).required(),
    apellido_paterno: Joi.string().max(100),
    apellido_materno: Joi.string().max(100),
    direccion: Joi.string(),
    telefono: Joi.string().max(15),
    correo: Joi.string().email().max(100),
    fuente_datos: Joi.string().valid('RENIEC', 'Manual').default('Manual'),
    datos_completos: Joi.object()
});

const updateClientSchema = Joi.object({
    dni: Joi.string().length(8).pattern(/^[0-9]+$/),
    nombre: Joi.string().max(100),
    apellido_paterno: Joi.string().max(100),
    apellido_materno: Joi.string().max(100),
    direccion: Joi.string(),
    telefono: Joi.string().max(15),
    correo: Joi.string().email().max(100),
    fuente_datos: Joi.string().valid('RENIEC', 'Manual'),
    datos_completos: Joi.object()
});

// GET - Obtener todos los clientes
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = `
      SELECT id_cliente, dni, nombre, apellido_paterno, apellido_materno, 
             direccion, telefono, correo, fecha_registro, fuente_datos
      FROM clientes
    `;
        let countQuery = 'SELECT COUNT(*) FROM clientes';
        const queryParams = [];
        let paramCount = 1;

        if (search) {
            const searchCondition = ` WHERE (dni ILIKE $${paramCount} OR nombre ILIKE $${paramCount} OR 
                             apellido_paterno ILIKE $${paramCount} OR apellido_materno ILIKE $${paramCount})`;
            query += searchCondition;
            countQuery += searchCondition;
            queryParams.push(`%${search}%`);
            paramCount++;
        }

        query += ` ORDER BY fecha_registro DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        queryParams.push(limit, offset);

        const [result, countResult] = await Promise.all([
            pool.query(query, queryParams),
            pool.query(countQuery, search ? [`%${search}%`] : [])
        ]);

        const total = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(total / limit);

        res.json({
            clientes: result.rows,
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
        console.error('Error al obtener clientes:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// GET - Obtener cliente por ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT * FROM clientes WHERE id_cliente = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener cliente:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST - Crear nuevo cliente
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { error } = createClientSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const {
            dni, nombre, apellido_paterno, apellido_materno,
            direccion, telefono, correo, fuente_datos, datos_completos
        } = req.body;

        // Verificar si el cliente ya existe
        const existingClient = await pool.query(
            'SELECT id_cliente FROM clientes WHERE dni = $1',
            [dni]
        );

        if (existingClient.rows.length > 0) {
            return res.status(400).json({ error: 'Ya existe un cliente con este DNI' });
        }

        const result = await pool.query(
            `INSERT INTO clientes (dni, nombre, apellido_paterno, apellido_materno, 
                     direccion, telefono, correo, fuente_datos, datos_completos) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
            [dni, nombre, apellido_paterno, apellido_materno,
                direccion, telefono, correo, fuente_datos || 'Manual', datos_completos]
        );

        res.status(201).json({
            message: 'Cliente creado exitosamente',
            cliente: result.rows[0]
        });
    } catch (error) {
        console.error('Error al crear cliente:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// PUT - Actualizar cliente
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = updateClientSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const {
            dni, nombre, apellido_paterno, apellido_materno,
            direccion, telefono, correo, fuente_datos, datos_completos
        } = req.body;

        // Si se está actualizando el DNI, verificar que no exista en otro cliente
        if (dni) {
            const existingClient = await pool.query(
                'SELECT id_cliente FROM clientes WHERE dni = $1 AND id_cliente != $2',
                [dni, id]
            );

            if (existingClient.rows.length > 0) {
                return res.status(400).json({ error: 'Ya existe otro cliente con este DNI' });
            }
        }

        const updates = [];
        const values = [];
        let paramCount = 1;

        const fields = {
            dni, nombre, apellido_paterno, apellido_materno,
            direccion, telefono, correo, fuente_datos, datos_completos
        };

        Object.entries(fields).forEach(([key, value]) => {
            if (value !== undefined) {
                updates.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        });

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No hay datos para actualizar' });
        }

        values.push(id);

        const result = await pool.query(
            `UPDATE clientes SET ${updates.join(', ')} 
       WHERE id_cliente = $${paramCount} 
       RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.json({
            message: 'Cliente actualizado exitosamente',
            cliente: result.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar cliente:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// DELETE - Eliminar cliente
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si el cliente tiene ventas asociadas
        const ventasResult = await pool.query(
            'SELECT COUNT(*) FROM ventas WHERE id_cliente = $1',
            [id]
        );

        if (parseInt(ventasResult.rows[0].count) > 0) {
            return res.status(400).json({
                error: 'No se puede eliminar el cliente porque tiene ventas asociadas'
            });
        }

        const result = await pool.query(
            'DELETE FROM clientes WHERE id_cliente = $1 RETURNING dni, nombre, apellido_paterno',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.json({
            message: 'Cliente eliminado exitosamente',
            cliente_eliminado: result.rows[0]
        });
    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// GET cliente por DNI (BD local + fallback RENIEC)
router.get('/dni/:dni', authenticateToken, async (req, res) => {
    const { dni } = req.params;

    try {
        // 1. Buscar en la BD local
        const result = await pool.query('SELECT * FROM clientes WHERE dni = $1', [dni]);

        if (result.rows.length > 0) {
            return res.json(result.rows[0]); // ✅ encontrado en BD local
        }

        // 2. Buscar en RENIEC (mock)
        const data = await buscarClientePorDNI(dni);
        if (!data) {
            return res.status(404).json({ error: 'Cliente no encontrado en BD local ni en RENIEC' });
        }

        // 3. Separar apellidos
        let apellido_paterno = null;
        let apellido_materno = null;
        if (data.apellidos) {
            const partes = data.apellidos.split(' ');
            apellido_paterno = partes[0] || null;
            apellido_materno = partes.slice(1).join(' ') || null;
        }

        // 4. Guardar en BD local (caché)
        const insertResult = await pool.query(
            `INSERT INTO clientes 
        (dni, nombre, apellido_paterno, apellido_materno, direccion, fuente_datos, datos_completos) 
       VALUES ($1,$2,$3,$4,$5,$6,$7) 
       RETURNING *`,
            [
                data.dni,
                data.nombres,
                apellido_paterno,
                apellido_materno,
                data.direccion,
                'RENIEC',
                data
            ]
        );

        return res.json(insertResult.rows[0]); // ✅ lo devuelve ya cacheado
    } catch (error) {
        console.error('Error al buscar cliente por DNI:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;