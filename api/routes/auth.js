const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const pool = require('../config/database');
const { generarToken } = require('../utils/jwt');

const router = express.Router();

const loginSchema = Joi.object({
    nombre_usuario: Joi.string().required(),
    clave: Joi.string().required()
});

router.post('/login', async (req, res) => {
    try {
        const { error } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { nombre_usuario, clave } = req.body;

        const result = await pool.query(
            'SELECT * FROM usuarios WHERE nombre_usuario = $1',
            [nombre_usuario]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const usuario = result.rows[0];

        const isValidPassword = await bcrypt.compare(clave, usuario.clave_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = generarToken(usuario);

        res.json({
            message: 'Login exitoso',
            token,
            usuario: {
                id_usuario: usuario.id_usuario,
                nombre_usuario: usuario.nombre_usuario,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;
