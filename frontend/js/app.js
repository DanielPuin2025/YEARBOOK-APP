const BACKEND_URL = location.protocol === 'file:' ? 'http://localhost:4000' : location.origin;
const API_BASE = `${BACKEND_URL}/api`;

let estadoApp = {
  rol: null,
  gradoActual: null,
  estudianteActual: null,
  gradosCache: [],
  anioActual: null,
  editandoEstudianteId: null
};

function fetchAdmin(url, options = {}) {
  const token = sessionStorage.getItem('adminToken');
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token || ''}`
    }
  }).then(response => {
    if (response.status === 401) {
      cerrarSesionAdmin();
      alert('Tu sesión de administrador expiró. Inicia sesión nuevamente.');
    }
    return response;
  });
}

function goTo(idPantalla) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(idPantalla).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function entrarComoVisitante() {
  estadoApp.rol = 'visitante';
  goTo('screen-bienvenida');
}

// Año que se muestra primero al visitante (luego puede elegir los demás)
const ANIO_PREDETERMINADO = 2026;

async function cargarGrados() {
  const cont = document.getElementById('lista-grados');
  const vacio = document.getElementById('grados-vacio');
  cont.innerHTML = '<p class="empty-text">Cargando grados...</p>';
  try {
    const res = await fetch(`${API_BASE}/grados`);
    const grados = await res.json();
    estadoApp.gradosCache = grados;
    if (grados.length === 0) {
      cont.innerHTML = '';
      document.getElementById('selector-anios').innerHTML = '';
      vacio.style.display = 'block';
      return;
    }
    vacio.style.display = 'none';

    // Cada año que agregues en el panel de administrador sale como un botón
    const anios = [...new Set(grados.map(g => g.anio))].sort((a, b) => a - b);
    if (!anios.includes(estadoApp.anioActual)) {
      estadoApp.anioActual = anios.includes(ANIO_PREDETERMINADO) ? ANIO_PREDETERMINADO : anios[anios.length - 1];
    }
    renderSelectorAnios(anios);
    renderGradosDelAnio();
  } catch (err) {
    cont.innerHTML = '<p class="empty-text">No se pudo conectar con el servidor. Verifica que el backend esté encendido.</p>';
    console.error(err);
  }
}

function renderSelectorAnios(anios) {
  const selector = document.getElementById('selector-anios');
  selector.innerHTML = '';
  anios.forEach(anio => {
    const btn = document.createElement('button');
    btn.className = 'anio-btn' + (anio === estadoApp.anioActual ? ' active' : '');
    btn.textContent = anio;
    btn.onclick = () => {
      estadoApp.anioActual = anio;
      renderSelectorAnios(anios);
      renderGradosDelAnio();
    };
    selector.appendChild(btn);
  });
}

function renderGradosDelAnio() {
  const cont = document.getElementById('lista-grados');
  document.getElementById('year-title').textContent = estadoApp.anioActual;
  cont.innerHTML = '';
  estadoApp.gradosCache
    .filter(g => g.anio === estadoApp.anioActual)
    .forEach(g => {
      const btn = document.createElement('button');
      btn.className = 'grado-btn';
      btn.textContent = `${g.nombre} ♥`;
      btn.onclick = () => seleccionarGrado(g);
      cont.appendChild(btn);
    });
}

function seleccionarGrado(grado) {
  estadoApp.gradoActual = grado;
  document.getElementById('grado-actual-chip').textContent = `${grado.nombre} · ${grado.anio}`;
  cargarEstudiantes(grado.id);
  goTo('screen-estudiantes');
}

function volverDesdeGrados() {
  if (estadoApp.rol === 'visitante') {
    goTo('screen-bienvenida');
  } else {
    goTo('screen-admin-panel');
  }
}

async function cargarEstudiantes(gradoId) {
  const grid = document.getElementById('grid-estudiantes');
  const vacio = document.getElementById('estudiantes-vacio');
  grid.innerHTML = '';
  try {
    const res = await fetch(`${API_BASE}/estudiantes?grado_id=${gradoId}`);
    const estudiantes = await res.json();
    if (estudiantes.length === 0) {
      vacio.style.display = 'block';
      return;
    }
    vacio.style.display = 'none';
    estudiantes.forEach(e => {
      const card = document.createElement('div');
      card.className = 'student-card';
      const foto = e.foto_url ? `${BACKEND_URL}${e.foto_url}` : 'assets/foto-placeholder.svg';
      card.innerHTML = `
        <img class="mini-photo" src="${foto}" alt="${e.nombre}">
        <span class="mini-name">${e.nombre}</span>
      `;
      card.onclick = () => verPerfil(e);
      grid.appendChild(card);
    });
  } catch (err) {
    grid.innerHTML = '<p class="empty-text">Error al cargar los estudiantes.</p>';
    console.error(err);
  }
}

function verPerfil(estudiante) {
  estadoApp.estudianteActual = estudiante;
  document.getElementById('perfil-nombre').textContent = estudiante.nombre;
  const foto = estudiante.foto_url ? `${BACKEND_URL}${estudiante.foto_url}` : 'assets/foto-placeholder.svg';
  document.getElementById('perfil-foto').src = foto;
  document.getElementById('perfil-frase').textContent = estudiante.frase || 'Este estudiante no escribió una frase.';
  document.getElementById('perfil-frase').style.display = 'none';
  goTo('screen-perfil');
}

function toggleFrase() {
  const p = document.getElementById('perfil-frase');
  p.style.display = p.style.display === 'none' ? 'block' : 'none';
}

function toggleMensajeDespedida() {
  const est = estadoApp.estudianteActual;
  if (!est) return;
  document.getElementById('despedida-texto').textContent =
    est.mensaje_despedida || 'Este estudiante aún no dejó un mensaje de despedida.';
  document.getElementById('overlay-despedida').classList.add('active');
}

function cerrarDespedida() {
  document.getElementById('overlay-despedida').classList.remove('active');
}

async function loginAdmin(evento) {
  evento.preventDefault();
  const usuario = document.getElementById('admin-usuario').value.trim();
  const password = document.getElementById('admin-password').value;
  const errorEl = document.getElementById('admin-login-error');
  errorEl.textContent = '';

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password })
    });
    const data = await res.json();
    if (!res.ok) {
      errorEl.textContent = data.error || 'No se pudo iniciar sesión.';
      return false;
    }
    sessionStorage.setItem('adminToken', data.token);
    estadoApp.rol = 'administrador';
    abrirPanelAdmin();
  } catch (err) {
    errorEl.textContent = 'No se pudo conectar con el servidor.';
    console.error(err);
  }
  return false;
}

function cerrarSesionAdmin() {
  sessionStorage.removeItem('adminToken');
  estadoApp.rol = null;
  goTo('screen-rol');
}

function abrirPanelAdmin() {
  goTo('screen-admin-panel');
  cargarGradosAdmin();
  cargarEstudiantesAdminSelect();
  cargarEstudiantesAdminLista();
}

function mostrarTabAdmin(tabId) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');
}

async function crearGrado(evento) {
  evento.preventDefault();
  const nombre = document.getElementById('nuevo-grado-nombre').value.trim();
  const anio = document.getElementById('nuevo-grado-anio').value;
  try {
    const res = await fetchAdmin(`${API_BASE}/grados`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, anio })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Error al crear el grado.');
      return false;
    }
    document.getElementById('form-nuevo-grado').reset();
    document.getElementById('nuevo-grado-anio').value = 2026;
    cargarGradosAdmin();
    cargarEstudiantesAdminSelect();
  } catch (err) {
    alert('Error al crear el grado.');
    console.error(err);
  }
  return false;
}

async function cargarGradosAdmin() {
  const cont = document.getElementById('admin-lista-grados');
  cont.innerHTML = 'Cargando...';
  try {
    const res = await fetch(`${API_BASE}/grados`);
    const grados = await res.json();
    estadoApp.gradosCache = grados;
    cont.innerHTML = '';
    grados.forEach(g => {
      const item = document.createElement('div');
      item.className = 'admin-item';
      item.innerHTML = `
        <div class="info"><strong>${g.nombre}</strong><span>Año ${g.anio}</span></div>
        <div class="actions">
          <button class="btn-eliminar" onclick="eliminarGrado(${g.id})">Eliminar</button>
        </div>`;
      cont.appendChild(item);
    });
  } catch (err) {
    cont.innerHTML = 'Error al cargar los grados.';
  }
}

async function eliminarGrado(id) {
  if (!confirm('¿Eliminar este grado y todos sus estudiantes?')) return;
  await fetchAdmin(`${API_BASE}/grados/${id}`, { method: 'DELETE' });
  cargarGradosAdmin();
  cargarEstudiantesAdminSelect();
  cargarEstudiantesAdminLista();
}

async function cargarEstudiantesAdminSelect() {
  const select = document.getElementById('estudiante-grado');
  select.innerHTML = '';
  const grados = estadoApp.gradosCache.length ? estadoApp.gradosCache : await (await fetch(`${API_BASE}/grados`)).json();
  grados.forEach(g => {
    const opt = document.createElement('option');
    opt.value = g.id;
    opt.textContent = `${g.nombre} · ${g.anio}`;
    select.appendChild(opt);
  });
}

async function cargarEstudiantesAdminLista() {
  const cont = document.getElementById('admin-lista-estudiantes');
  cont.innerHTML = 'Cargando...';
  try {
    const res = await fetch(`${API_BASE}/estudiantes`);
    const estudiantes = await res.json();
    cont.innerHTML = '';
    estudiantes.forEach(e => {
      const foto = e.foto_url ? `${BACKEND_URL}${e.foto_url}` : 'assets/foto-placeholder.svg';
      const item = document.createElement('div');
      item.className = 'admin-item';
      item.innerHTML = `
        <img src="${foto}" alt="${e.nombre}">
        <div class="info"><strong>${e.nombre}</strong><span>${e.frase || 'Sin frase'}</span></div>
        <div class="actions">
          <button class="btn-editar" onclick='editarEstudiante(${JSON.stringify(e)})'>Editar</button>
          <button class="btn-eliminar" onclick="eliminarEstudiante(${e.id})">Eliminar</button>
        </div>`;
      cont.appendChild(item);
    });
  } catch (err) {
    cont.innerHTML = 'Error al cargar los estudiantes.';
  }
}

function editarEstudiante(e) {
  estadoApp.editandoEstudianteId = e.id;
  document.getElementById('estudiante-id').value = e.id;
  document.getElementById('estudiante-grado').value = e.grado_id;
  document.getElementById('estudiante-nombre').value = e.nombre;
  document.getElementById('estudiante-frase').value = e.frase || '';
  document.getElementById('estudiante-mensaje').value = e.mensaje_despedida || '';
  document.getElementById('btn-guardar-estudiante').textContent = 'Actualizar estudiante';
  document.getElementById('btn-cancelar-edicion').style.display = 'inline-block';
  mostrarTabAdmin('tab-estudiantes');
  document.getElementById('form-estudiante').scrollIntoView({ behavior: 'smooth' });
}

function cancelarEdicionEstudiante() {
  estadoApp.editandoEstudianteId = null;
  document.getElementById('form-estudiante').reset();
  document.getElementById('estudiante-id').value = '';
  document.getElementById('btn-guardar-estudiante').textContent = 'Guardar estudiante';
  document.getElementById('btn-cancelar-edicion').style.display = 'none';
}

async function guardarEstudiante(evento) {
  evento.preventDefault();
  const id = document.getElementById('estudiante-id').value;
  const formData = new FormData();
  formData.append('grado_id', document.getElementById('estudiante-grado').value);
  formData.append('nombre', document.getElementById('estudiante-nombre').value);
  formData.append('frase', document.getElementById('estudiante-frase').value);
  formData.append('mensaje_despedida', document.getElementById('estudiante-mensaje').value);
  const fotoInput = document.getElementById('estudiante-foto');
  if (fotoInput.files[0]) formData.append('foto', fotoInput.files[0]);

  try {
    if (id) {
      await fetchAdmin(`${API_BASE}/estudiantes/${id}`, { method: 'PUT', body: formData });
    } else {
      await fetchAdmin(`${API_BASE}/estudiantes`, { method: 'POST', body: formData });
    }
    cancelarEdicionEstudiante();
    cargarEstudiantesAdminLista();
  } catch (err) {
    alert('Error al guardar el estudiante.');
    console.error(err);
  }
  return false;
}

async function eliminarEstudiante(id) {
  if (!confirm('¿Eliminar este estudiante?')) return;
  await fetchAdmin(`${API_BASE}/estudiantes/${id}`, { method: 'DELETE' });
  cargarEstudiantesAdminLista();
}

const _goToOriginal = goTo;
goTo = function (idPantalla) {
  _goToOriginal(idPantalla);
  if (idPantalla === 'screen-anio') cargarGrados();
};

// ========================================
// VENTANA DE CREADORAS
// ========================================

function abrirCreadoras() {
  const overlay = document.getElementById('overlay-creadoras');

  if (overlay) {
    overlay.classList.add('active');
  }
}

function cerrarCreadoras() {
  const overlay = document.getElementById('overlay-creadoras');

  if (overlay) {
    overlay.classList.remove('active');
  }
}