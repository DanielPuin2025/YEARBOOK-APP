// db.js - Conexión a MySQL usando mysql2 (pool de conexiones)
require('dotenv').config();
const mysql = require('mysql2');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'yearbook_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Crear la base de datos si aún no existe
const rawConn = mysql.createConnection({
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
  port: dbConfig.port
});

// Evita que un error de conexión inicial tumbe todo el proceso
rawConn.on('error', (err) => {
  console.error('❌ Error de conexión inicial a MySQL:', err.message);
});

rawConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`, (err) => {
  if (err) {
    console.error('❌ Error asegurando la base de datos en MySQL:', err.message);
    return;
  }
  rawConn.end();
});

const pool = mysql.createPool(dbConfig);

// Versión con promesas para usar async/await en las rutas
const promisePool = pool.promise();

// Probar conexión al iniciar
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Error conectando a MySQL:', err.message);
    console.error('Revisa que MySQL esté iniciado (ej. en XAMPP) y la configuración en .env');
  } else {
    console.log('✅ Conectado a MySQL correctamente (base de datos: ' + dbConfig.database + ')');
    connection.release();
  }
});

module.exports = promisePool;