const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const { createAdminToken } = require('../middleware/auth');

// POST /api/auth/login -> valida usuario y clave del administrador
router.post('/login', async (req, res) => {
  try {
    const { usuario, password } = req.body;
    if (!usuario || !password) {
      return res.status(400).json({ error: 'Usuario y clave son obligatorios' });
    }

    const [rows] = await db.query('SELECT * FROM administradores WHERE usuario = ?', [usuario]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuario o clave incorrectos' });
    }

    const admin = rows[0];
    const passwordValida = await bcrypt.compare(password, admin.password);
    if (!passwordValida) {
      return res.status(401).json({ error: 'Usuario o clave incorrectos' });
    }

    res.json({
      mensaje: 'Inicio de sesion exitoso',
      token: createAdminToken(admin.id),
      admin: { id: admin.id, usuario: admin.usuario, nombre_completo: admin.nombre_completo }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en el inicio de sesion' });
  }
});

module.exports = router;