const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

// GET /api/grados -> lista todos los grados
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM grados ORDER BY anio DESC, nombre ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener los grados' });
  }
});

// POST /api/grados -> crear un grado nuevo (admin)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { nombre, anio } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre del grado es obligatorio' });

    const [result] = await db.query(
      'INSERT INTO grados (nombre, anio) VALUES (?, ?)',
      [nombre, anio || 2026]
    );
    res.status(201).json({ id: result.insertId, nombre, anio: anio || 2026 });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ese grado ya existe en ese año' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error al crear el grado' });
  }
});

// DELETE /api/grados/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM grados WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Grado eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar el grado' });
  }
});

module.exports = router;