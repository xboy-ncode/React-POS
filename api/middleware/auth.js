const { pool } = require('../config/database'); 
const { verificarToken } = require('../utils/jwt');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    const decoded = verificarToken(token);
    if (!decoded) {
        return res.status(403).json({ error: 'Token inválido o expirado' });
    }

    try {
const result = await pool.query(
    'SELECT id_usuario, nombre_usuario, rol FROM usuarios WHERE id_usuario = $1',
    [decoded.id_usuario]
);

if (result.rows.length === 0) {
    return res.status(401).json({ error: 'Usuario no encontrado' });
}

req.user = result.rows[0];
        next();
    } catch (error) {
        console.error('Error en autenticación:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.rol)) {
            return res.status(403).json({ error: 'Permisos insuficientes' });
        }
        next();
    };
};

module.exports = { authenticateToken, requireRole };