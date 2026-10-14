const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAdmin } = require('../middleware/auth');

// Configuración de almacenamiento de fotos
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const nombreUnico = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, nombreUnico);
  }
});
const upload = multer({ storage });

// GET /api/estudiantes?grado_id=1 -> lista estudiantes de un grado (o todos si no se envía)
router.get('/', async (req, res) => {
  try {
    const { grado_id } = req.query;
    let query = 'SELECT * FROM estudiantes';
    let params = [];
    if (grado_id) {
      query += ' WHERE grado_id = ?';
      params.push(grado_id);
    }
    query += ' ORDER BY nombre ASC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener los estudiantes' });
  }
});

// GET /api/estudiantes/:id -> perfil de un estudiante
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM estudiantes WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Estudiante no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener el estudiante' });
  }
});

// POST /api/estudiantes -> crear estudiante (admin), con foto opcional
router.post('/', requireAdmin, upload.single('foto'), async (req, res) => {
  try {
    const { grado_id, nombre, frase, mensaje_despedida } = req.body;
    if (!grado_id || !nombre) {
      return res.status(400).json({ error: 'grado_id y nombre son obligatorios' });
    }
    const foto_url = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await db.query(
      'INSERT INTO estudiantes (grado_id, nombre, foto_url, frase, mensaje_despedida) VALUES (?, ?, ?, ?, ?)',
      [grado_id, nombre, foto_url, frase || null, mensaje_despedida || null]
    );
    res.status(201).json({ id: result.insertId, grado_id, nombre, foto_url, frase, mensaje_despedida });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear el estudiante' });
  }
});

// PUT /api/estudiantes/:id -> editar estudiante (admin), foto opcional
router.put('/:id', requireAdmin, upload.single('foto'), async (req, res) => {
  try {
    const { grado_id, nombre, frase, mensaje_despedida } = req.body;
    const [existentes] = await db.query('SELECT * FROM estudiantes WHERE id = ?', [req.params.id]);
    if (existentes.length === 0) return res.status(404).json({ error: 'Estudiante no encontrado' });

    const actual = existentes[0];
    const foto_url = req.file ? `/uploads/${req.file.filename}` : actual.foto_url;

    await db.query(
      'UPDATE estudiantes SET grado_id = ?, nombre = ?, foto_url = ?, frase = ?, mensaje_despedida = ? WHERE id = ?',
      [
        grado_id || actual.grado_id,
        nombre || actual.nombre,
        foto_url,
        frase !== undefined ? frase : actual.frase,
        mensaje_despedida !== undefined ? mensaje_despedida : actual.mensaje_despedida,
        req.params.id
      ]
    );
    res.json({ mensaje: 'Estudiante actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar el estudiante' });
  }
});

// DELETE /api/estudiantes/:id -> eliminar estudiante (admin)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM estudiantes WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Estudiante eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar el estudiante' });
  }
});

module.exports = router;