// api/utils/reniec.js
//Highly recomend to change in case you are in other country or using other service


const axios = require('axios');

const RENIEC_API_URL = process.env.RENIEC_API_URL;
const RENIEC_TOKEN = process.env.RENIEC_API_TOKEN; 

/**
 * Buscar cliente por DNI en la API de RENIEC
 * @param {string} dni - DNI de 8 dígitos
 * @returns {Promise<Object|null>} - Datos del cliente o null si no se encuentra
 */
async function buscarClientePorDNI(dni) {
  try {
    // Validar que el DNI tenga 8 dígitos
    if (!dni || dni.length !== 8 || !/^\d+$/.test(dni)) {
      throw new Error('DNI debe tener exactamente 8 dígitos numéricos');
    }

    // Llamada a la API de RENIEC
    const response = await axios.post(
      RENIEC_API_URL,
      { dni },
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RENIEC_TOKEN}`
        },
        timeout: 10000 // 10 segundos timeout
      }
    );

    // Verificar si la respuesta fue exitosa
    if (!response.data.success || !response.data.data) {
      return null; // No encontrado en RENIEC
    }

    const data = response.data.data;

    // Transformar al formato que usa tu aplicación
    return {
      dni: data.numero,
      nombres: data.nombres,
      apellidos: `${data.apellido_paterno} ${data.apellido_materno}`.trim(),
      apellido_paterno: data.apellido_paterno,
      apellido_materno: data.apellido_materno,
      nombre_completo: data.nombre_completo,
      codigo_verificacion: data.codigo_verificacion,
      // Campos opcionales que no vienen de la API pero tu BD puede necesitar
      direccion: null,
      fechaNacimiento: null,
      sexo: null,
      estadoCivil: null
    };

  } catch (error) {
    // Manejo de errores específicos
    if (error.response) {
      // La API respondió con un error
      console.error('Error de API RENIEC:', error.response.status, error.response.data);
      
      if (error.response.status === 401) {
        throw new Error('Token de RENIEC inválido o expirado');
      }
      if (error.response.status === 404) {
        return null; // DNI no encontrado
      }
      if (error.response.status === 429) {
        throw new Error('Límite de consultas RENIEC excedido');
      }
    } else if (error.request) {
      // La petición se hizo pero no hubo respuesta
      console.error('No se recibió respuesta de RENIEC:', error.message);
      throw new Error('Servicio de RENIEC no disponible');
    } else {
      // Error en la configuración de la petición
      console.error('Error al consultar RENIEC:', error.message);
      throw error;
    }
  }
}

module.exports = { buscarClientePorDNI };