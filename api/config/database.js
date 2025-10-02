// database.js
const pg = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

// Conexión a la base que simula RENIEC
const reniecDb = new Pool({
    host: process.env.RENIEC_DB_HOST,
    port: Number(process.env.RENIEC_DB_PORT),
    database: process.env.RENIEC_DB_NAME,
    user: process.env.RENIEC_DB_USER,
    password: process.env.RENIEC_DB_PASSWORD,
});

// Exportar con CommonJS
module.exports = { pool, reniecDb };