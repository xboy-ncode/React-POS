const { reniecDb } = require('../config/database');

// 🔹 Buscar en RENIEC (mock BD por ahora)
async function buscarClientePorDNI(dni) {
  try {
    // Consulta en la BD RENIEC simulada
    const result = await reniecDb.query(
      'SELECT * FROM personas WHERE dni = $1', // asumiendo que tu tabla mock se llama `personas`
      [dni]
    );

    if (result.rows.length === 0) {
      return null; // no encontrado en RENIEC
    }

    // Transformar al mismo formato que esperas
    const row = result.rows[0];
    return {
      dni: row.dni,
      nombres: row.nombres,
      apellidos: row.apellidos,
      direccion: row.direccion,
      fechaNacimiento: row.fecha_nacimiento,
      sexo: row.sexo,
      estadoCivil: row.estado_civil,
    };
  } catch (error) {
    console.error('Error al consultar RENIEC:', error);
    throw error;
  }
}

// ✅ Exportar con CommonJS
module.exports = { buscarClientePorDNI };