// routes/products.js - Con soporte completo de precios
const express = require('express');
const Joi = require('joi');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// =============================
// Esquemas de validación
// =============================
const createProductSchema = Joi.object({
    nombre: Joi.string().max(150).required(),
    descripcion: Joi.string().allow(null, ''),
    codigo: Joi.string().max(50).allow(null, ''),
    codigo_barras: Joi.string().max(50).allow(null, '').pattern(/^[0-9A-Za-z-]*$/),
    id_categoria: Joi.number().integer().allow(null),
    id_marca: Joi.number().integer().allow(null),
    stock: Joi.number().integer().min(0).default(0),
    // Nuevos campos de precios
    precio_compra: Joi.number().min(0).required(),
    precio_venta_minorista: Joi.number().min(0).required(),
    precio_venta_mayorista: Joi.number().min(0).allow(null),
    precio_oferta: Joi.number().min(0).allow(null),
    margen_minorista: Joi.number().min(0).max(999.99).default(0),
    margen_mayorista: Joi.number().min(0).max(999.99).allow(null),
    en_oferta: Joi.boolean().default(false),
    porcentaje_descuento_oferta: Joi.number().min(0).max(100).default(0),
    cantidad_minima_mayorista: Joi.number().integer().min(1).default(1),
    // Campos legacy
    precio_unitario: Joi.number().positive().optional(), // Mantener para compatibilidad
    moneda: Joi.string().valid('USD', 'PEN').default('PEN'),
    activo: Joi.boolean().default(true)
});

const updateProductSchema = Joi.object({
    nombre: Joi.string().max(150),
    descripcion: Joi.string().allow(null, ''),
    codigo: Joi.string().max(50).allow(null, ''),
    codigo_barras: Joi.string().max(50).allow(null, '').pattern(/^[0-9A-Za-z-]*$/),
    id_categoria: Joi.number().integer().allow(null),
    id_marca: Joi.number().integer().allow(null),
    stock: Joi.number().integer().min(0),
    // Nuevos campos de precios
    precio_compra: Joi.number().min(0),
    precio_venta_minorista: Joi.number().min(0),
    precio_venta_mayorista: Joi.number().min(0).allow(null),
    precio_oferta: Joi.number().min(0).allow(null),
    margen_minorista: Joi.number().min(0).max(999.99),
    margen_mayorista: Joi.number().min(0).max(999.99).allow(null),
    en_oferta: Joi.boolean(),
    porcentaje_descuento_oferta: Joi.number().min(0).max(100),
    cantidad_minima_mayorista: Joi.number().integer().min(1),
    // Campos legacy
    precio_unitario: Joi.number().positive(),
    moneda: Joi.string().valid('USD', 'PEN'),
    activo: Joi.boolean()
}).min(1);

// Esquema para calcular precios basados en márgenes
const calculatePriceSchema = Joi.object({
    precio_compra: Joi.number().min(0).required(),
    margen_minorista: Joi.number().min(0).max(999.99),
    margen_mayorista: Joi.number().min(0).max(999.99),
    porcentaje_descuento_oferta: Joi.number().min(0).max(100)
});

// =============================
// NUEVA RUTA - Calcular precios
// =============================
router.post('/calcular-precios', authenticateToken, async (req, res) => {
    try {
        const { error } = calculatePriceSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const {
            precio_compra,
            margen_minorista = 0,
            margen_mayorista = 0,
            porcentaje_descuento_oferta = 0
        } = req.body;

        const precio_venta_minorista = precio_compra * (1 + margen_minorista / 100);
        const precio_venta_mayorista = margen_mayorista > 0 
            ? precio_compra * (1 + margen_mayorista / 100) 
            : null;
        const precio_oferta = porcentaje_descuento_oferta > 0
            ? precio_venta_minorista * (1 - porcentaje_descuento_oferta / 100)
            : null;

        res.json({
            precio_compra,
            precio_venta_minorista: parseFloat(precio_venta_minorista.toFixed(2)),
            precio_venta_mayorista: precio_venta_mayorista ? parseFloat(precio_venta_mayorista.toFixed(2)) : null,
            precio_oferta: precio_oferta ? parseFloat(precio_oferta.toFixed(2)) : null,
            margen_minorista,
            margen_mayorista
        });
    } catch (error) {
        console.error('Error al calcular precios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// GET - Obtener todos los productos
router.get('/', authenticateToken, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            categoria = '',
            marca = '',
            activo = '',
            codigo_barras = '',
            en_oferta = '' // 👈 Nuevo filtro
        } = req.query;

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
            return res.status(400).json({ error: 'Parámetros de paginación inválidos' });
        }

        let query = `
            SELECT 
                p.*,
                c.nombre AS categoria_nombre,
                c.id_categoria,
                m.nombre AS marca_nombre,
                m.id_marca
            FROM productos p
            LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
            LEFT JOIN marcas m ON p.id_marca = m.id_marca
        `;

        let countQuery = `
            SELECT COUNT(*) 
            FROM productos p
            LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
            LEFT JOIN marcas m ON p.id_marca = m.id_marca
        `;

        const conditions = [];
        const queryParams = [];
        let paramCount = 1;

        if (codigo_barras) {
            conditions.push(`p.codigo_barras = $${paramCount}`);
            queryParams.push(codigo_barras);
            paramCount++;
        }

        if (search) {
            conditions.push(`(p.nombre ILIKE $${paramCount} OR p.descripcion ILIKE $${paramCount} OR p.codigo ILIKE $${paramCount} OR p.codigo_barras ILIKE $${paramCount})`);
            queryParams.push(`%${search}%`);
            paramCount++;
        }

        if (categoria) {
            conditions.push(`p.id_categoria = $${paramCount}`);
            queryParams.push(categoria);
            paramCount++;
        }

        if (marca) {
            conditions.push(`p.id_marca = $${paramCount}`);
            queryParams.push(marca);
            paramCount++;
        }

        if (activo !== '') {
            conditions.push(`p.activo = $${paramCount}`);
            queryParams.push(activo === 'true');
            paramCount++;
        }

        // 👇 Nuevo filtro por ofertas
        if (en_oferta !== '') {
            conditions.push(`p.en_oferta = $${paramCount}`);
            queryParams.push(en_oferta === 'true');
            paramCount++;
        }

        if (conditions.length > 0) {
            const whereClause = ` WHERE ${conditions.join(' AND ')}`;
            query += whereClause;
            countQuery += whereClause;
        }

        query += ` ORDER BY p.nombre LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        queryParams.push(limitNum, offset);

        const [result, countResult] = await Promise.all([
            pool.query(query, queryParams),
            pool.query(countQuery, queryParams.slice(0, -2))
        ]);

        const total = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(total / limitNum);

        res.json({
            productos: result.rows,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});



// =============================
// NUEVA RUTA - Validar unicidad de código de barras
// =============================
router.get('/validate/barcode', authenticateToken, async (req, res) => {
    try {
        const { codigo_barras, exclude_id } = req.query;

        if (!codigo_barras) {
            return res.status(400).json({ error: 'El código de barras es requerido' });
        }

        let query = `
            SELECT id_producto, nombre, codigo, codigo_barras 
            FROM productos 
            WHERE codigo_barras = $1
        `;
        const params = [codigo_barras];

        // Si estamos editando, excluir el producto actual
        if (exclude_id) {
            query += ' AND id_producto != $2';
            params.push(exclude_id);
        }

        query += ' LIMIT 1';

        const result = await pool.query(query, params);

        if (result.rows.length > 0) {
            // Código de barras ya existe
            return res.json({
                unique: false,
                exists: true,
                product: {
                    id: result.rows[0].id_producto,
                    nombre: result.rows[0].nombre,
                    codigo: result.rows[0].codigo
                }
            });
        }

        // Código de barras disponible
        res.json({
            unique: true,
            exists: false
        });
    } catch (error) {
        console.error('Error al validar código de barras:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// =============================
// NUEVA RUTA - Validar unicidad de SKU
// =============================
router.get('/validate/sku', authenticateToken, async (req, res) => {
    try {
        const { codigo, exclude_id } = req.query;

        if (!codigo) {
            return res.status(400).json({ error: 'El código SKU es requerido' });
        }

        let query = `
            SELECT id_producto, nombre, codigo 
            FROM productos 
            WHERE codigo = $1
        `;
        const params = [codigo];

        if (exclude_id) {
            query += ' AND id_producto != $2';
            params.push(exclude_id);
        }

        query += ' LIMIT 1';

        const result = await pool.query(query, params);

        if (result.rows.length > 0) {
            return res.json({
                unique: false,
                exists: true,
                product: {
                    id: result.rows[0].id_producto,
                    nombre: result.rows[0].nombre
                }
            });
        }

        res.json({
            unique: true,
            exists: false
        });
    } catch (error) {
        console.error('Error al validar SKU:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// =============================
// NUEVA RUTA - Búsqueda rápida por código de barras
// =============================
router.get('/search/barcode/:barcode', authenticateToken, async (req, res) => {
    try {
        const { barcode } = req.params;

        if (!barcode || barcode.trim().length < 3) {
            return res.status(400).json({ 
                error: 'El código de barras debe tener al menos 3 caracteres' 
            });
        }

        const result = await pool.query(`
            SELECT 
                p.*,
                c.nombre AS categoria_nombre,
                c.id_categoria,
                m.nombre AS marca_nombre,
                m.id_marca
            FROM productos p
            LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
            LEFT JOIN marcas m ON p.id_marca = m.id_marca
            WHERE p.codigo_barras = $1 AND p.activo = true
            LIMIT 1
        `, [barcode.trim()]);

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Producto no encontrado',
                barcode: barcode.trim()
            });
        }

        const producto = result.rows[0];

        // Validaciones adicionales
        if (!producto.activo) {
            return res.status(400).json({
                error: 'Producto no disponible',
                producto: {
                    id: producto.id_producto,
                    nombre: producto.nombre
                }
            });
        }

        if (producto.stock <= 0) {
            return res.status(400).json({
                error: 'Producto sin stock',
                producto: {
                    id: producto.id_producto,
                    nombre: producto.nombre,
                    stock: producto.stock
                }
            });
        }

        res.json({
            success: true,
            producto: producto
        });
    } catch (error) {
        console.error('Error al buscar por código de barras:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});




// GET - Obtener producto por ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT 
                p.*,
                c.nombre AS categoria_nombre,
                c.id_categoria,
                m.nombre AS marca_nombre,
                m.id_marca
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
router.post('/', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { error } = createProductSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const {
            nombre,
            descripcion,
            codigo,
            codigo_barras,
            id_categoria,
            id_marca,
            stock,
            precio_compra,
            precio_venta_minorista,
            precio_venta_mayorista,
            precio_oferta,
            margen_minorista,
            margen_mayorista,
            en_oferta,
            porcentaje_descuento_oferta,
            cantidad_minima_mayorista,
            precio_unitario, // legacy
            moneda,
            activo
        } = req.body;

        const result = await pool.query(
            `INSERT INTO productos 
             (nombre, descripcion, codigo, codigo_barras, id_categoria, id_marca, stock, 
              precio_compra, precio_venta_minorista, precio_venta_mayorista, precio_oferta,
              margen_minorista, margen_mayorista, en_oferta, porcentaje_descuento_oferta,
              cantidad_minima_mayorista, precio_unitario, moneda, activo) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) 
             RETURNING *`,
            [
                nombre,
                descripcion,
                codigo,
                codigo_barras || null,
                id_categoria,
                id_marca,
                stock || 0,
                precio_compra,
                precio_venta_minorista,
                precio_venta_mayorista || null,
                precio_oferta || null,
                margen_minorista || 0,
                margen_mayorista || null,
                en_oferta !== undefined ? en_oferta : false,
                porcentaje_descuento_oferta || 0,
                cantidad_minima_mayorista || 1,
                precio_unitario || precio_venta_minorista, // usar precio minorista como fallback
                moneda || 'PEN',
                activo !== false
            ]
        );

        // Obtener el producto completo con relaciones
        const fullProduct = await pool.query(`
            SELECT 
                p.*,
                c.nombre AS categoria_nombre,
                m.nombre AS marca_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
            LEFT JOIN marcas m ON p.id_marca = m.id_marca
            WHERE p.id_producto = $1
        `, [result.rows[0].id_producto]);

        res.status(201).json({
            message: 'Producto creado exitosamente',
            producto: fullProduct.rows[0]
        });
 } catch (error) {
        console.error('Error al crear producto:', error);

        // Manejo específico de código de barras duplicado
        if (error.code === '23505') {
            if (error.constraint === 'productos_codigo_barras_key') {
                return res.status(400).json({
                    error: 'El código de barras ya existe',
                    field: 'codigo_barras',
                    constraint: 'unique'
                });
            }
            if (error.constraint === 'productos_codigo_key') {
                return res.status(400).json({
                    error: 'El código SKU ya existe',
                    field: 'codigo',
                    constraint: 'unique'
                });
            }
        }

        // Manejo de foreign key (categoría/marca inválida)
        if (error.code === '23503') {
            return res.status(400).json({
                error: 'Categoría o marca no válida',
                field: error.constraint,
                constraint: 'foreign_key'
            });
        }

        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// PUT - Actualizar producto
router.put('/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = updateProductSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const updates = [];
        const values = [];
        let paramCount = 1;

        const allowedFields = [
            'nombre',
            'descripcion',
            'codigo',
            'codigo_barras',
            'id_categoria',
            'id_marca',
            'stock',
            'precio_compra',
            'precio_venta_minorista',
            'precio_venta_mayorista',
            'precio_oferta',
            'margen_minorista',
            'margen_mayorista',
            'en_oferta',
            'porcentaje_descuento_oferta',
            'cantidad_minima_mayorista',
            'precio_unitario',
            'moneda',
            'activo'
        ];

        Object.entries(req.body).forEach(([key, value]) => {
            if (value !== undefined && allowedFields.includes(key)) {
                updates.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        });

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No hay datos para actualizar' });
        }

        values.push(id);

        await pool.query(
            `UPDATE productos SET ${updates.join(', ')} WHERE id_producto = $${paramCount}`,
            values
        );

        // Obtener el producto actualizado con relaciones
        const result = await pool.query(`
            SELECT 
                p.*,
                c.nombre AS categoria_nombre,
                m.nombre AS marca_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
            LEFT JOIN marcas m ON p.id_marca = m.id_marca
            WHERE p.id_producto = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({
            message: 'Producto actualizado exitosamente',
            producto: result.rows[0]
        });
   } catch (error) {
        console.error('Error al actualizar producto:', error);

        if (error.code === '23505') {
            if (error.constraint === 'productos_codigo_barras_key') {
                return res.status(400).json({
                    error: 'El código de barras ya existe en otro producto',
                    field: 'codigo_barras',
                    constraint: 'unique'
                });
            }
            if (error.constraint === 'productos_codigo_key') {
                return res.status(400).json({
                    error: 'El código SKU ya existe en otro producto',
                    field: 'codigo',
                    constraint: 'unique'
                });
            }
        }

        if (error.code === '23503') {
            return res.status(400).json({
                error: 'Categoría o marca no válida',
                field: error.constraint,
                constraint: 'foreign_key'
            });
        }

        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// DELETE - Eliminar producto
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;

        const [ventasResult, comprasResult] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM detalle_ventas WHERE id_producto = $1', [id]),
            pool.query('SELECT COUNT(*) FROM detalle_compras WHERE id_producto = $1', [id])
        ]);

        if (parseInt(ventasResult.rows[0].count) > 0 || parseInt(comprasResult.rows[0].count) > 0) {
            return res.status(400).json({
                error: 'No se puede eliminar el producto porque tiene transacciones asociadas'
            });
        }

        const result = await pool.query('DELETE FROM productos WHERE id_producto = $1 RETURNING nombre', [id]);

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




// =============================
// NUEVA RUTA - Estadísticas de productos con barcode
// =============================
router.get('/stats/barcode', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_productos,
                COUNT(CASE WHEN codigo_barras IS NOT NULL AND codigo_barras != '' THEN 1 END) as con_barcode,
                COUNT(CASE WHEN codigo_barras IS NULL OR codigo_barras = '' THEN 1 END) as sin_barcode,
                COUNT(CASE WHEN activo = true THEN 1 END) as activos,
                COUNT(CASE WHEN activo = false THEN 1 END) as inactivos
            FROM productos
        `);

        const stats = result.rows[0];

        res.json({
            total: parseInt(stats.total_productos),
            con_barcode: parseInt(stats.con_barcode),
            sin_barcode: parseInt(stats.sin_barcode),
            porcentaje_con_barcode: stats.total_productos > 0 
                ? ((stats.con_barcode / stats.total_productos) * 100).toFixed(2)
                : 0,
            activos: parseInt(stats.activos),
            inactivos: parseInt(stats.inactivos)
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// =============================
// NUEVA RUTA - Búsqueda múltiple (barcode, SKU o nombre)
// =============================
router.get('/search/multi', authenticateToken, async (req, res) => {
    try {
        const { query, limit = 10 } = req.query;

        if (!query || query.trim().length < 2) {
            return res.status(400).json({ 
                error: 'La búsqueda debe tener al menos 2 caracteres' 
            });
        }

        const searchTerm = query.trim();

        const result = await pool.query(`
            SELECT 
                p.*,
                c.nombre AS categoria_nombre,
                m.nombre AS marca_nombre,
                CASE 
                    WHEN p.codigo_barras = $1 THEN 1
                    WHEN p.codigo = $1 THEN 2
                    WHEN p.nombre ILIKE $2 THEN 3
                    ELSE 4
                END as relevancia
            FROM productos p
            LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
            LEFT JOIN marcas m ON p.id_marca = m.id_marca
            WHERE 
                p.codigo_barras = $1 
                OR p.codigo = $1 
                OR p.nombre ILIKE $2
                AND p.activo = true
            ORDER BY relevancia, p.nombre
            LIMIT $3
        `, [searchTerm, `%${searchTerm}%`, limit]);

        res.json({
            success: true,
            query: searchTerm,
            results: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error en búsqueda múltiple:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});




module.exports = router;