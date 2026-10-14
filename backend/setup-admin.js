// setup-admin.js
// Ejecutar UNA VEZ con: node setup-admin.js
// Crea (o actualiza) el usuario administrador con la contraseña encriptada correctamente.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

const USUARIO = process.env.ADMIN_USERNAME || 'admin';
const PASSWORD = process.env.ADMIN_PASSWORD;
const NOMBRE = 'Administrador Year Book';

(async () => {
  try {
    if (!PASSWORD) {
      throw new Error('Configura ADMIN_PASSWORD antes de ejecutar este script.');
    }
    const hash = await bcrypt.hash(PASSWORD, 10);
    const [existentes] = await db.query('SELECT id FROM administradores WHERE usuario = ?', [USUARIO]);

    if (existentes.length > 0) {
      await db.query('UPDATE administradores SET password = ?, nombre_completo = ? WHERE usuario = ?', [hash, NOMBRE, USUARIO]);
      console.log(`✅ Contraseña actualizada para el usuario "${USUARIO}".`);
    } else {
      await db.query('INSERT INTO administradores (usuario, password, nombre_completo) VALUES (?, ?, ?)', [USUARIO, hash, NOMBRE]);
      console.log(`✅ Usuario administrador "${USUARIO}" creado correctamente.`);
    }
    console.log(`👉 Ya puedes iniciar sesión con el usuario "${USUARIO}" y ADMIN_PASSWORD.`);
  } catch (err) {
    console.error('❌ Error configurando el administrador:', err.message);
  } finally {
    process.exit();
  }
})();