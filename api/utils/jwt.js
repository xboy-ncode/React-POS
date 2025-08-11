// utils/jwt.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Generar un token JWT
const generarToken = (usuario) => {
    return jwt.sign(
        {
            id_usuario: usuario.id_usuario,
            nombre_usuario: usuario.nombre_usuario,
            rol: usuario.rol
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// Verificar un token JWT
const verificarToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null; // Si es inválido o expirado
    }
};

module.exports = { generarToken, verificarToken };
