require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4000;
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');

if (process.env.NODE_ENV === 'production') {
  if (!process.env.ADMIN_PASSWORD) {
    throw new Error('ADMIN_PASSWORD debe configurarse en producción.');
  }
  if (!process.env.AUTH_TOKEN_SECRET || process.env.AUTH_TOKEN_SECRET.length < 32) {
    throw new Error('AUTH_TOKEN_SECRET debe tener al menos 32 caracteres en producción.');
  }
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir las fotos subidas
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Servir el frontend (para que funcione con una sola URL, en PC y celular)
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Rutas de la API
app.use('/api/grados', require('./routes/grados'));
app.use('/api/estudiantes', require('./routes/estudiantes'));
app.use('/api/auth', require('./routes/auth'));

app.get('/api', (req, res) => {
  res.json({ mensaje: 'API Year Book Digital funcionando correctamente 🎓💜' });
});

// Auto-inicialización de tablas y usuario administrador
const bcrypt = require('bcryptjs');
const db = require('./db');

async function inicializarBaseDeDatos() {
  try {
    // 1. Tabla administradores
    await db.query(`
      CREATE TABLE IF NOT EXISTS administradores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        nombre_completo VARCHAR(100),
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Tabla grados
    await db.query(`
      CREATE TABLE IF NOT EXISTS grados (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(20) NOT NULL,
        anio INT NOT NULL DEFAULT 2026,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_grado_anio (nombre, anio)
      )
    `);

    // 2b. Permite repetir el mismo grado (11-A) en años distintos (corrige tablas ya creadas)
    const [viejo] = await db.query(
      "SELECT COUNT(*) AS n FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'grados' AND index_name = 'nombre'"
    );
    if (viejo[0].n > 0) {
      await db.query('ALTER TABLE grados DROP INDEX nombre');
    }
    const [nuevo] = await db.query(
      "SELECT COUNT(*) AS n FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'grados' AND index_name = 'uq_grado_anio'"
    );
    if (nuevo[0].n === 0) {
      await db.query('ALTER TABLE grados ADD UNIQUE KEY uq_grado_anio (nombre, anio)');
    }

    // 3. Tabla estudiantes
    await db.query(`
      CREATE TABLE IF NOT EXISTS estudiantes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        grado_id INT NOT NULL,
        nombre VARCHAR(150) NOT NULL,
        foto_url VARCHAR(255) DEFAULT NULL,
        frase VARCHAR(255) DEFAULT NULL,
        mensaje_despedida TEXT DEFAULT NULL,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (grado_id) REFERENCES grados(id) ON DELETE CASCADE
      )
    `);

    // 4. Crear administrador por defecto si no existe
    const usuarioInicial = process.env.ADMIN_USERNAME || 'admin';
    const passwordInicial = process.env.ADMIN_PASSWORD || 'admin123';
    const [admins] = await db.query(
      'SELECT id FROM administradores WHERE usuario = ?',
      [usuarioInicial]
    );
    if (admins.length === 0) {
      const hash = await bcrypt.hash(passwordInicial, 10);
      await db.query(
        'INSERT INTO administradores (usuario, password, nombre_completo) VALUES (?, ?, ?)',
        [usuarioInicial, hash, 'Administrador Year Book']
      );
      console.log(`👑 Administrador inicial listo -> Usuario: ${usuarioInicial}`);
    } else {
      console.log('👑 Administrador verificado en la base de datos.');
    }

    // 5. Grados por defecto si está vacío
    const [grados] = await db.query('SELECT id FROM grados LIMIT 1');
    if (grados.length === 0) {
      await db.query("INSERT INTO grados (nombre, anio) VALUES ('11-A', 2026), ('11-B', 2026)");
      console.log('📚 Grados iniciales registrados (11-A, 11-B).');
    }
  } catch (err) {
    console.error('ℹ️ Nota en inicialización de tablas:', err.message);
  }
}

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📱 Desde el celular (misma red WiFi) usa la IP de tu PC, ej: http://192.168.1.X:${PORT}`);
  await inicializarBaseDeDatos();
});