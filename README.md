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
5. Monta almacenamiento persistente en `/app/backend/uploads`; allí se guardan las fotos que se carguen desde la app. Las fotos de las creadoras y el marcador de foto están en `frontend/assets`; asegúrate de incluir `diana.jpeg`, `sara.jpeg`, `laurymar.jpeg` y `foto-placeholder.svg` en el cambio publicado.
6. Espera a que termine la compilación y asigna el dominio en Easypanel. Configura el DNS del dominio con el destino/IP que Easypanel indique y activa HTTPS.

La base de datos y las fotos locales no se incluyen al subir el código. El servidor crea las tablas necesarias al arrancar. El archivo `database/yearbook.sql` contiene solo el esquema inicial, no los datos actuales de producción.

## Actualizar una instalación existente

1. Publica los cambios de la aplicación en el repositorio conectado a Easypanel y vuelve a desplegar el servicio.
2. Conserva el volumen persistente montado en `/app/backend/uploads`. No reemplaces `backend/.env` ni el contenido del volumen al desplegar el código.
3. Para sustituir los datos por la copia completa, primero exporta un respaldo de la base actual. Importa `database/yearbook_db.sql` en una base de datos nueva y vacía; el volcado contiene los registros de administrador, grados y estudiantes, y no selecciona la base de destino por sí solo. La cuenta de administrador también se reemplaza, así que confirma que tienes la contraseña correspondiente antes de cambiar `DB_NAME`.
4. Configura `DB_NAME` para apuntar a la base nueva y reinicia o vuelve a desplegar la aplicación. Comprueba el inicio de sesión, los grados, los estudiantes y sus fotos antes de retirar la base anterior.

`database/yearbook.sql` contiene solo el esquema inicial y no es el respaldo completo de producción. No lo uses para restaurar la base con los datos del ZIP. El volcado completo contiene datos personales; mantenlo fuera del repositorio público y no lo incluyas en un commit. El ZIP también incluye un `.env`: no lo despliegues ni sobrescribas las variables configuradas en Easypanel. Si ese ZIP se compartió fuera del equipo, cambia las credenciales y secretos que pudiera contener.

## Desarrollo local

Copia `backend/.env.example` como `backend/.env`, completa la conexión local a MySQL y ejecuta:

```powershell
cd backend
npm install
npm start
```

Abre `http://localhost:4000`.
