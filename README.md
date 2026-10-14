# Yearbook App

Aplicación Node.js/Express con frontend estático y MySQL. Express sirve la interfaz y la API desde el mismo servicio; en Easypanel se despliega usando el `Dockerfile` de la raíz.

## Despliegue en Easypanel

1. Crea un servicio de base de datos MySQL y una base de datos vacía para Yearbook.
2. Crea un servicio de aplicación desde el repositorio GitHub, con la raíz del proyecto como contexto de compilación.
3. Configura el servicio para usar el `Dockerfile` de la raíz y el puerto interno `4000`.
4. Agrega estas variables al servicio:
   - `DB_HOST`: nombre interno del servicio MySQL en Easypanel.
   - `DB_PORT`: puerto MySQL interno, normalmente `3306`.
   - `DB_NAME`: `yearbook_db` (o el nombre de base de datos creado).
   - `DB_USER` y `DB_PASSWORD`: credenciales del usuario MySQL.
   - `ADMIN_USERNAME`: usuario inicial del administrador (opcional; por defecto `admin`).
   - `ADMIN_PASSWORD`: contraseña larga y única para el administrador.
   - `AUTH_TOKEN_SECRET`: secreto aleatorio de al menos 32 caracteres.
5. Monta almacenamiento persistente en `/app/backend/uploads`; allí se guardan las fotos que se carguen desde la app.
6. Espera a que termine la compilación y asigna el dominio en Easypanel. Configura el DNS del dominio con el destino/IP que Easypanel indique y activa HTTPS.

La base de datos y las fotos locales no se incluyen al subir el código. El servidor crea las tablas necesarias al arrancar. El archivo `database/yearbook.sql` también contiene el esquema, sin datos de estudiantes.

## Desarrollo local

Copia `backend/.env.example` como `backend/.env`, completa la conexión local a MySQL y ejecuta:

```powershell
cd backend
npm install
npm start
```

Abre `http://localhost:4000`.
